begin;

-- Reversible admin-only removal. Payment, reservation and accounting records remain intact.
alter table public.orders add column deleted_at timestamptz;

create function public.admin_set_order_deleted(input_order_id uuid, input_expected_updated_at timestamptz, input_deleted boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare previous_order public.orders%rowtype;
begin
  if auth.uid() is null or not public.has_admin_role(array['admin']::public.admin_role[]) then
    raise exception 'admin_required';
  end if;
  if input_deleted is null then raise exception 'invalid_order_input'; end if;
  select * into previous_order from public.orders where id = input_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if (previous_order.deleted_at is not null) = input_deleted then return input_order_id; end if;
  if input_expected_updated_at is null or input_expected_updated_at <> previous_order.updated_at then
    raise exception 'order_conflict';
  end if;
  update public.orders set deleted_at = case when input_deleted then now() else null end where id = input_order_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(auth.uid(), case when input_deleted then 'order.trashed' else 'order.restored' end, 'order', input_order_id,
    jsonb_build_object('deleted', previous_order.deleted_at is not null), jsonb_build_object('deleted', input_deleted));
  return input_order_id;
end;
$$;
revoke all on function public.admin_set_order_deleted(uuid,timestamptz,boolean) from public, anon, service_role;
grant execute on function public.admin_set_order_deleted(uuid,timestamptz,boolean) to authenticated;

-- Cursor pagination stays stable when new mail arrives. RLS restricts receipts to the current staff member.
create function public.get_admin_mailbox_page(input_before timestamptz default null, input_before_id uuid default null, input_search text default '', input_limit integer default 51)
returns table(id uuid, sender_name text, sender_address text, reply_address text, subject text, received_at timestamptz, body_limited boolean, is_read boolean)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_admin_role() then raise exception 'admin_required'; end if;
  if input_limit is null or input_limit not between 1 and 101 or length(coalesce(input_search,'')) > 120
    or (input_before is null) <> (input_before_id is null) then raise exception 'invalid_mailbox_page'; end if;
  return query
  select m.id, m.sender_name, m.sender_address, m.reply_address, m.subject, m.received_at, m.body_limited,
    exists(select 1 from public.admin_notification_reads r where r.profile_id = auth.uid() and r.category = 'email' and r.entity_id = m.id)
  from public.mailbox_messages m
  where (input_before is null or (m.received_at,m.id) < (input_before,input_before_id))
    and (coalesce(btrim(input_search),'') = '' or position(lower(btrim(input_search)) in lower(m.subject || ' ' || m.sender_name || ' ' || m.sender_address)) > 0)
  order by m.received_at desc, m.id desc limit input_limit;
end;
$$;
revoke all on function public.get_admin_mailbox_page(timestamptz,uuid,text,integer) from public, anon, service_role;
grant execute on function public.get_admin_mailbox_page(timestamptz,uuid,text,integer) to authenticated;

commit;
