begin;

-- Read receipts are personal. They never change an order, inquiry, or email.
create table public.admin_notification_reads (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('orders', 'inquiries', 'email')),
  entity_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (profile_id, category, entity_id)
);

alter table public.admin_notification_reads enable row level security;
create policy admin_notification_reads_own_select
on public.admin_notification_reads for select to authenticated
using (profile_id = auth.uid() and public.has_admin_role());

-- Browsers can only inspect their own receipts. All marks go through the RPC,
-- which validates the category and the existence of every requested entity.
revoke all on public.admin_notification_reads from public, anon, authenticated;
grant select on public.admin_notification_reads to authenticated;
grant select, insert, update, delete on public.admin_notification_reads to service_role;

create function public.get_admin_notifications()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor_id uuid := auth.uid();
  result jsonb;
begin
  if actor_id is null or not public.has_admin_role() then
    raise exception 'admin_required';
  end if;

  with unread as materialized (
    select 'orders'::text as category, o.id as entity_id, o.created_at,
      o.reference as label, o.status::text as status
    from public.orders o
    where not exists (
      select 1 from public.admin_notification_reads r
      where r.profile_id = actor_id and r.category = 'orders' and r.entity_id = o.id
    )
    union all
    select 'inquiries', q.id, q.created_at, q.name, q.status::text
    from public.quote_requests q
    where not exists (
      select 1 from public.admin_notification_reads r
      where r.profile_id = actor_id and r.category = 'inquiries' and r.entity_id = q.id
    )
    union all
    select 'email', e.id, e.created_at, e.email_type, e.status::text
    from public.email_events e
    where not exists (
      select 1 from public.admin_notification_reads r
      where r.profile_id = actor_id and r.category = 'email' and r.entity_id = e.id
    )
  )
  select jsonb_build_object(
    'counts', (
      select jsonb_build_object(
        'orders', count(*) filter (where category = 'orders'),
        'inquiries', count(*) filter (where category = 'inquiries'),
        'email', count(*) filter (where category = 'email')
      ) from unread
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category', n.category, 'entityId', n.entity_id,
        'createdAt', n.created_at, 'label', n.label, 'status', n.status
      ) order by n.created_at desc, n.entity_id desc, n.category)
      from (
        select * from unread
        order by created_at desc, entity_id desc, category
        limit 12
      ) n
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create function public.mark_admin_notifications_read(input_category text, input_entity_ids uuid[])
returns integer language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := auth.uid();
  expected_count integer;
  existing_count integer;
  inserted_count integer;
begin
  if actor_id is null or not public.has_admin_role() then
    raise exception 'admin_required';
  end if;
  if input_category is null or input_category not in ('orders', 'inquiries', 'email') then
    raise exception 'invalid_notification_category';
  end if;
  if input_entity_ids is null or cardinality(input_entity_ids) not between 1 and 100
    or array_ndims(input_entity_ids) <> 1 then
    raise exception 'invalid_notification_ids';
  end if;
  if array_position(input_entity_ids, null) is not null then
    raise exception 'invalid_notification_ids';
  end if;

  select count(distinct id) into expected_count from unnest(input_entity_ids) ids(id);
  -- Lock only explicitly supplied existing entities. A concurrently arriving
  -- entity cannot be marked by an earlier list, and deletion cannot race this
  -- validation. Consistent lock order also avoids reversed-batch deadlocks.
  case input_category
    when 'orders' then
      perform o.id from public.orders o where o.id = any(input_entity_ids)
        order by o.id for key share;
    when 'inquiries' then
      perform q.id from public.quote_requests q where q.id = any(input_entity_ids)
        order by q.id for key share;
    when 'email' then
      perform e.id from public.email_events e where e.id = any(input_entity_ids)
        order by e.id for key share;
  end case;
  get diagnostics existing_count = row_count;
  if existing_count <> expected_count then
    raise exception 'notification_not_found';
  end if;

  insert into public.admin_notification_reads(profile_id, category, entity_id)
  select actor_id, input_category, id from (select distinct unnest(input_entity_ids) as id) requested
  order by id
  on conflict (profile_id, category, entity_id) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.get_admin_notifications() from public, anon, service_role;
revoke all on function public.mark_admin_notifications_read(text, uuid[]) from public, anon, service_role;
grant execute on function public.get_admin_notifications() to authenticated;
grant execute on function public.mark_admin_notifications_read(text, uuid[]) to authenticated;

-- Keep RLS enabled and preserve all existing publication members and policies.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['orders', 'admin_notification_reads'] loop
    if not exists (
      select 1 from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = table_name and c.relrowsecurity
    ) then
      raise exception 'admin_realtime_requires_rls:%', table_name;
    end if;
  end loop;

  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['orders', 'admin_notification_reads'] loop
      if not exists (
        select 1 from pg_catalog.pg_publication_tables p
        where p.pubname = 'supabase_realtime' and p.schemaname = 'public'
          and p.tablename = table_name
      ) then
        execute format('alter publication %I add table %I.%I', 'supabase_realtime', 'public', table_name);
      end if;
    end loop;
  else
    raise notice 'supabase_realtime publication absent; table publication skipped';
  end if;
end;
$$;

commit;
