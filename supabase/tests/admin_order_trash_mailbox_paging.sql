begin;
do $$
declare
  admin_id uuid; editor_id uuid; customer_id uuid;
  oid uuid; version timestamptz; original_status public.order_status; original_total int;
  first_ids uuid[]; second_ids uuid[]; third_ids uuid[]; last_id uuid;
  rejected boolean; audit_count int; payment_count int; stock_count int;
begin
  select profile_id into admin_id from public.admin_roles where role='admin' and active limit 1;
  select profile_id into editor_id from public.admin_roles where role='editor' and active limit 1;
  customer_id := gen_random_uuid();
  insert into auth.users(id,email) values(customer_id,'trash-customer@example.test');
  select id,updated_at,status,total_cents into oid,version,original_status,original_total from public.orders where status='paid' limit 1;
  if oid is null then raise exception 'TEST missing paid fixture'; end if;
  select count(*) into payment_count from public.payments;
  select sum(stock_quantity) into stock_count from public.products;
  insert into public.mailbox_messages(id,mailbox,uid_validity,imap_uid,sender_address,subject,received_at)
  select md5('paging-'||n)::uuid,'kontakt@bistrava.com','paging',n,'paging@example.test','Paging message '||n,'2026-10-01T12:00:00Z'::timestamptz
  from generate_series(1,120) n;

  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  execute 'set local role authenticated';
  rejected:=false;
  begin perform public.admin_set_order_deleted(oid,version,true); exception when others then if sqlerrm='admin_required' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST editor can trash'; end if;
  perform set_config('request.jwt.claim.sub',customer_id::text,true);
  rejected:=false;
  begin perform public.get_admin_mailbox_page(); exception when others then if sqlerrm='admin_required' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST customer can list mail'; end if;
  rejected:=false;
  begin perform public.admin_set_order_deleted(oid,version,true); exception when others then if sqlerrm='admin_required' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST customer can trash'; end if;

  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  rejected:=false;
  begin perform public.admin_set_order_deleted(oid,'2000-01-01',true); exception when others then if sqlerrm='order_conflict' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST stale update accepted'; end if;
  perform public.admin_set_order_deleted(oid,version,true);
  if not (select deleted_at is not null and status=original_status and total_cents=original_total from public.orders where id=oid) then raise exception 'TEST trash changed business data'; end if;
  perform public.admin_set_order_deleted(oid,version,true);
  select count(*) into audit_count from public.audit_logs where entity_id=oid and action='order.trashed';
  if audit_count<>1 then raise exception 'TEST duplicate trash audit'; end if;
  select updated_at into version from public.orders where id=oid;
  perform public.admin_set_order_deleted(oid,version,false);
  if (select deleted_at is not null from public.orders where id=oid) then raise exception 'TEST restore failed'; end if;
  if (select count(*) from public.payments)<>payment_count or (select sum(stock_quantity) from public.products)<>stock_count then raise exception 'TEST financial or stock side effect'; end if;

  select array_agg(id order by received_at desc,id desc) into first_ids from public.get_admin_mailbox_page(null,null,'Paging',50);
  if cardinality(first_ids)<>50 then raise exception 'TEST first page'; end if;
  last_id:=first_ids[50];
  select array_agg(id order by received_at desc,id desc) into second_ids from public.get_admin_mailbox_page('2026-10-01T12:00:00Z',last_id,'Paging',50);
  if cardinality(second_ids)<>50 or first_ids && second_ids then raise exception 'TEST second page duplicates'; end if;
  select array_agg(id order by received_at desc,id desc) into third_ids from public.get_admin_mailbox_page('2026-10-01T12:00:00Z',second_ids[50],'Paging',50);
  if cardinality(third_ids)<>20 or third_ids && (first_ids||second_ids) then raise exception 'TEST final page'; end if;
  if exists(select 1 from public.get_admin_mailbox_page() where is_read) then raise exception 'TEST unread default'; end if;
  perform public.mark_admin_notifications_read('email',array[first_ids[1]]);
  if not (select is_read from public.get_admin_mailbox_page() where id=first_ids[1]) then raise exception 'TEST mark read'; end if;
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  if (select is_read from public.get_admin_mailbox_page() where id=first_ids[1]) then raise exception 'TEST receipts leaked between users'; end if;
  if (select count(*) from public.get_admin_mailbox_page(null,null,'Paging message 120',51))<>1 then raise exception 'TEST global search'; end if;
  rejected:=false;
  begin perform public.get_admin_mailbox_page(null,null,'',102); exception when others then if sqlerrm='invalid_mailbox_page' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST unbounded page'; end if;
  execute 'reset role';
end;
$$;
rollback;
