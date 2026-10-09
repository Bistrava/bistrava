begin;

-- The delivery ledger is written by trusted server code, never by an
-- authenticated browser. Existing staff SELECT access remains unchanged.
drop policy if exists email_events_staff_insert on public.email_events;

-- Supabase Postgres Changes checks the subscribing user's SELECT policies.
-- Keep both tables private under their existing RLS policies; publishing a
-- table must not introduce anonymous access or change business write access.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['quote_requests', 'email_events'] loop
    if not exists (
      select 1
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = table_name
        and c.relrowsecurity
    ) then
      raise exception 'admin_realtime_requires_rls:%', table_name;
    end if;
  end loop;

  -- Supabase owns this publication. Plain PostgreSQL/PGlite test databases
  -- may not have it; do not create or replace infrastructure publications.
  if exists (
    select 1 from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  ) then
    foreach table_name in array array['quote_requests', 'email_events'] loop
      if not exists (
        select 1 from pg_catalog.pg_publication_tables p
        where p.pubname = 'supabase_realtime'
          and p.schemaname = 'public'
          and p.tablename = table_name
      ) then
        execute format(
          'alter publication %I add table %I.%I',
          'supabase_realtime', 'public', table_name
        );
      end if;
    end loop;
  else
    raise notice 'supabase_realtime publication absent; table publication skipped';
  end if;
end;
$$;

commit;
