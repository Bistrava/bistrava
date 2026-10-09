-- Isolated SQL test fixtures only. All data and role changes are rolled back.
-- Requires migrations through 019, active admin/editor fixtures, and empty reads.
begin;

do $$
declare
  admin_id uuid; editor_id uuid; second_admin uuid := gen_random_uuid();
  customer_id uuid := gen_random_uuid(); order_id uuid := gen_random_uuid();
  email_id uuid := gen_random_uuid(); future_id uuid := gen_random_uuid();
  inquiry_ids uuid[] := '{}'; inquiry_id uuid; bad_ids uuid[]; bad_category text;
  order_ref text := 'NOTIFY-' || gen_random_uuid()::text;
  baseline jsonb; snapshot jsonb; expected_counts jsonb;
  rejected boolean; inserted integer; previous_count bigint; i integer;
begin
  select profile_id into admin_id from public.admin_roles where role='admin' and active limit 1;
  select profile_id into editor_id from public.admin_roles where role='editor' and active limit 1;
  if admin_id is null or editor_id is null then raise exception 'TEST admin/editor fixtures required'; end if;
  if exists(select 1 from public.admin_notification_reads) then raise exception 'TEST use isolated empty notification receipts'; end if;

  insert into auth.users(id,email) values
    (second_admin,'notification-admin@example.test'),(customer_id,'notification-customer@example.test');
  insert into public.admin_roles(profile_id,role) values(second_admin,'admin');
  insert into public.orders(id,reference,email,subtotal_cents,total_cents,billing_address_snapshot,shipping_address_snapshot,created_at)
  values(order_id,order_ref,'notification-order@example.test',0,0,'{}','{}',now()+interval '1 day 20 seconds');
  insert into public.email_events(id,email_type,recipient_hash,idempotency_key,status,created_at)
  values(email_id,'notification_test',repeat('a',64),'notification-test-'||email_id,'sent',now()+interval '1 day 21 seconds');
  for i in 1..14 loop
    inquiry_id := gen_random_uuid();
    inquiry_ids := array_append(inquiry_ids,inquiry_id);
    insert into public.quote_requests(id,request_type,name,email,message,consent_version,consented_at,ip_hash,created_at)
    values(inquiry_id,'contact','Notification inquiry '||i,'notification-inquiry@example.test',
      'Local notification fixture only','local',now(),repeat('a',64),now()+interval '1 day'+i*interval '1 second');
  end loop;
  expected_counts := jsonb_build_object('orders',(select count(*) from public.orders),
    'inquiries',(select count(*) from public.quote_requests),'email',(select count(*) from public.email_events));

  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  execute 'set local role authenticated';
  baseline := public.get_admin_notifications();
  if baseline->'counts' <> expected_counts then raise exception 'TEST exact unread counts'; end if;
  if jsonb_array_length(baseline->'items') <> 12 then raise exception 'TEST top twelve items'; end if;
  if baseline#>>'{items,0,entityId}' <> email_id::text or baseline#>>'{items,0,label}' <> 'notification_test'
    or baseline#>>'{items,0,status}' <> 'sent' or baseline#>>'{items,0,category}' <> 'email'
    or (baseline#>>'{items,0,createdAt}')::timestamptz <> now()+interval '1 day 21 seconds'
    or baseline#>>'{items,1,entityId}' <> order_id::text or baseline#>>'{items,1,label}' <> order_ref
    or baseline#>>'{items,2,label}' <> 'Notification inquiry 14' then
    raise exception 'TEST notification labels, timestamps, status and ordering';
  end if;

  inserted := public.mark_admin_notifications_read('inquiries',array[inquiry_ids[1],inquiry_ids[2],inquiry_ids[1]]);
  if inserted <> 2 or public.mark_admin_notifications_read('inquiries',array[inquiry_ids[1],inquiry_ids[2]]) <> 0 then
    raise exception 'TEST idempotent duplicate receipt';
  end if;
  if public.mark_admin_notifications_read('orders',array[order_id]) <> 1
    or public.mark_admin_notifications_read('email',array[email_id]) <> 1 then
    raise exception 'TEST category marks';
  end if;
  snapshot := public.get_admin_notifications();
  if (snapshot#>>'{counts,inquiries}')::bigint <> (baseline#>>'{counts,inquiries}')::bigint-2
    or (snapshot#>>'{counts,orders}')::bigint <> (baseline#>>'{counts,orders}')::bigint-1
    or (snapshot#>>'{counts,email}')::bigint <> (baseline#>>'{counts,email}')::bigint-1 then
    raise exception 'TEST counts after marks';
  end if;
  if exists(select 1 from jsonb_array_elements(snapshot->'items') item
    where item->>'entityId'=any(array[order_id,email_id,inquiry_ids[1],inquiry_ids[2]]::text[])) then
    raise exception 'TEST marked item remains in unread list';
  end if;

  for bad_category in select value from (values(null::text),(''),('messages')) x(value) loop
    rejected := false;
    begin perform public.mark_admin_notifications_read(bad_category,array[inquiry_ids[3]]);
    exception when others then
      if sqlerrm <> 'invalid_notification_category' then raise; end if; rejected := true;
    end;
    if not rejected then raise exception 'TEST invalid category accepted'; end if;
  end loop;
  for bad_ids in select ids from (values(null::uuid[]),('{}'::uuid[]),(array[null::uuid]),
    (array_fill(inquiry_ids[3],array[101])),(array_fill(inquiry_ids[3],array[2,2]))) x(ids) loop
    rejected := false;
    begin perform public.mark_admin_notifications_read('inquiries',bad_ids);
    exception when others then
      if sqlerrm <> 'invalid_notification_ids' then raise; end if; rejected := true;
    end;
    if not rejected then raise exception 'TEST invalid ID array accepted'; end if;
  end loop;
  -- Wrong category and mixed known/unknown IDs must reject the whole batch.
  foreach bad_ids slice 1 in array array[array[order_id,inquiry_ids[3]],array[future_id,inquiry_ids[3]]] loop
    rejected := false;
    begin perform public.mark_admin_notifications_read('inquiries',bad_ids);
    exception when others then
      if sqlerrm <> 'notification_not_found' then raise; end if; rejected := true;
    end;
    if not rejected then raise exception 'TEST unknown or wrong-category entity accepted'; end if;
  end loop;
  if exists(select 1 from public.admin_notification_reads where entity_id in(inquiry_ids[3],future_id)) then
    raise exception 'TEST failed batch created partial or future receipts';
  end if;

  rejected := false;
  begin insert into public.admin_notification_reads(profile_id,category,entity_id) values(admin_id,'inquiries',inquiry_ids[3]);
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'TEST direct browser insert allowed'; end if;
  rejected := false;
  begin update public.admin_notification_reads set read_at=now();
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'TEST direct browser update allowed'; end if;
  rejected := false;
  begin delete from public.admin_notification_reads;
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'TEST direct browser delete allowed'; end if;

  -- Another administrator has independent counts and cannot see the first's receipts.
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',second_admin::text,true);
  execute 'set local role authenticated';
  if public.get_admin_notifications()->'counts' <> baseline->'counts'
    or exists(select 1 from public.admin_notification_reads) then raise exception 'TEST second admin isolation'; end if;
  if public.mark_admin_notifications_read('inquiries',array[inquiry_ids[1]]) <> 1 then raise exception 'TEST second admin mark'; end if;
  if (select count(*) from public.admin_notification_reads) <> 1 then raise exception 'TEST second admin receipt visibility'; end if;

  -- Editors can mark their own receipts but cannot clear another user's inbox.
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',editor_id::text,true);
  execute 'set local role authenticated';
  if public.get_admin_notifications()->'counts' <> baseline->'counts'
    or exists(select 1 from public.admin_notification_reads) then raise exception 'TEST editor isolation'; end if;
  if public.mark_admin_notifications_read('inquiries',array[inquiry_ids[3]]) <> 1 then raise exception 'TEST editor personal mark'; end if;
  if exists(select 1 from public.admin_notification_reads where profile_id <> editor_id) then raise exception 'TEST editor sees others receipts'; end if;
  execute 'reset role';
  update public.admin_roles set active=false where profile_id=editor_id;
  execute 'set local role authenticated';
  rejected := false;
  begin perform public.get_admin_notifications();
  exception when others then if sqlerrm <> 'admin_required' then raise; end if; rejected := true; end;
  if not rejected or exists(select 1 from public.admin_notification_reads) then raise exception 'TEST inactive staff access'; end if;
  rejected := false;
  begin perform public.mark_admin_notifications_read('inquiries',array[inquiry_ids[4]]);
  exception when others then if sqlerrm <> 'admin_required' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'TEST inactive staff mark'; end if;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub',customer_id::text,true);
  execute 'set local role authenticated';
  rejected := false;
  begin perform public.get_admin_notifications();
  exception when others then if sqlerrm <> 'admin_required' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'TEST ordinary customer gets staff notifications'; end if;
  rejected := false;
  begin perform public.mark_admin_notifications_read('inquiries',array[inquiry_ids[4]]);
  exception when others then if sqlerrm <> 'admin_required' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'TEST ordinary customer marks staff notifications'; end if;
  execute 'reset role'; execute 'set local role anon';
  rejected := false;
  begin perform public.get_admin_notifications(); exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'TEST anonymous RPC read'; end if;
  rejected := false;
  begin perform public.mark_admin_notifications_read('inquiries',array[inquiry_ids[4]]);
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'TEST anonymous RPC mark'; end if;
  rejected := false;
  begin perform 1 from public.admin_notification_reads; exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'TEST anonymous table read'; end if;

  -- Arrival after the displayed ID list was captured remains unread when that
  -- earlier explicit batch is marked. A previously rejected future ID is safe.
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  execute 'set local role authenticated';
  previous_count := (public.get_admin_notifications()#>>'{counts,inquiries}')::bigint;
  execute 'reset role';
  insert into public.quote_requests(id,request_type,name,email,message,consent_version,consented_at,ip_hash,created_at)
  values(future_id,'contact','Arrived after list','later@example.test','Only a local SQL fixture','local',now(),repeat('a',64),now()+interval '2 days');
  execute 'set local role authenticated';
  if public.mark_admin_notifications_read('inquiries',array[inquiry_ids[4]]) <> 1 then raise exception 'TEST stale list mark'; end if;
  snapshot := public.get_admin_notifications();
  if (snapshot#>>'{counts,inquiries}')::bigint <> previous_count
    or snapshot#>>'{items,0,entityId}' <> future_id::text
    or exists(select 1 from public.admin_notification_reads where entity_id=future_id) then
    raise exception 'TEST concurrent arrival was cleared';
  end if;
  execute 'reset role';
end;
$$;

rollback;
