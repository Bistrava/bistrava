begin;
do $$
declare
  cart jsonb:='[{"sku":"TEST-01","quantity":1}]';
  rate uuid:='20000000-0000-4000-8000-000000000001';
  customer jsonb:='{"firstName":"Test","lastName":"Only"}'; address jsonb:='{"countryCode":"SI","postalCode":"1000","city":"Ljubljana","addressLine1":"Test only"}';
  key uuid:=gen_random_uuid(); card_order record; duplicate record; other record; quote jsonb; total integer; before_stock integer; rejected boolean; result jsonb;
begin
  select stock_quantity into before_stock from public.products where sku='TEST-01';
  quote:=public.quote_guest_checkout(cart,rate,null);
  total:=(quote->>'totalCents')::integer;
  execute 'set local role authenticated';
  rejected:=false;
  begin perform public.create_card_order(cart,'test@example.test','123456789',customer,address,rate,'',repeat('c',64),key,null,total);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'TEST browser may create card orders'; end if;
  rejected:=false;
  begin perform public.record_card_payment_event('evt_browser','payment_intent.succeeded','pi_browser123',total,'eur','{}');
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'TEST browser may record card payments'; end if;
  execute 'reset role';
  execute 'set local role service_role';
  select * into card_order from public.create_card_order(cart,'test@example.test','123456789',customer,address,rate,'',repeat('c',64),key,null,total);
  select * into duplicate from public.create_card_order(cart,'test@example.test','123456789',customer,address,rate,'',repeat('c',64),key,null,total);
  if card_order.order_id<>duplicate.order_id then raise exception 'TEST idempotent card order'; end if;
  execute 'reset role';
  if (select stock_quantity from public.products where sku='TEST-01')<>before_stock-1 then raise exception 'TEST duplicate card reservation'; end if;
  if not exists(select 1 from public.orders where id=card_order.order_id and status='awaiting_payment' and checkout_mode='card' and bank_transfer_snapshot is null and reservation_expires_at is null)
    then raise exception 'TEST card order state'; end if;
  if not exists(select 1 from public.payments where order_id=card_order.order_id and provider='stripe' and status='pending' and amount_cents=total)
    then raise exception 'TEST card payment row'; end if;
  execute 'set local role service_role';
  rejected:=false;
  begin perform public.attach_card_payment_intent(card_order.order_id,'not-an-intent');
  exception when others then if sqlerrm='invalid_payment_intent' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST invalid intent id accepted'; end if;
  perform public.attach_card_payment_intent(card_order.order_id,'pi_localtest123');
  perform public.attach_card_payment_intent(card_order.order_id,'pi_localtest123');
  rejected:=false;
  begin perform public.attach_card_payment_intent(card_order.order_id,'pi_othertest456');
  exception when others then if sqlerrm='card_payment_not_found' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST payment intent replaced'; end if;
  -- A declined card leaves the order waiting; a later success still pays it.
  result:=public.record_card_payment_event('evt_failed','payment_intent.payment_failed','pi_localtest123',total,'eur','{}');
  execute 'reset role';
  if result->>'status'<>'processed' or not exists(select 1 from public.payments where order_id=card_order.order_id and status='failed')
    then raise exception 'TEST failed card payment'; end if;
  execute 'set local role service_role';
  result:=public.record_card_payment_event('evt_wrong_amount','payment_intent.succeeded','pi_localtest123',total+1,'eur','{}');
  execute 'reset role';
  if result->>'status'<>'amount_mismatch' or exists(select 1 from public.orders where id=card_order.order_id and status='paid')
    then raise exception 'TEST wrong amount marked paid'; end if;
  execute 'set local role service_role';
  result:=public.record_card_payment_event('evt_paid','payment_intent.succeeded','pi_localtest123',total,'eur','{"id":"pi_localtest123"}');
  if result->>'status'<>'processed' or (result->>'newlyPaid')::boolean is not true then raise exception 'TEST card success result %', result; end if;
  result:=public.record_card_payment_event('evt_paid','payment_intent.succeeded','pi_localtest123',total,'eur','{}');
  if result->>'status'<>'duplicate' then raise exception 'TEST duplicate event not detected'; end if;
  result:=public.record_card_payment_event('sync:pi_localtest123:succeeded','payment_intent.succeeded','pi_localtest123',total,'eur','{}');
  if (result->>'newlyPaid')::boolean then raise exception 'TEST second confirmation would e-mail twice'; end if;
  result:=public.record_card_payment_event('evt_late_failure','payment_intent.payment_failed','pi_localtest123',total,'eur','{}');
  result:=public.record_card_payment_event('evt_unknown','payment_intent.succeeded','pi_unknown789',total,'eur','{}');
  if result->>'status'<>'ignored' then raise exception 'TEST unknown intent'; end if;
  execute 'reset role';
  if not exists(select 1 from public.orders where id=card_order.order_id and status='paid')
    or not exists(select 1 from public.payments where order_id=card_order.order_id and status='paid' and paid_at is not null and failed_at is null)
    then raise exception 'TEST card order not paid or downgraded by a late failure'; end if;
  if (select count(*) from public.audit_logs where entity_type='payment' and action='payment.card_confirmed' and after_data->>'reference'='pi_localtest123')<>1
    then raise exception 'TEST card audit missing or duplicated'; end if;
  if (select count(*) from public.payment_events where provider='stripe' and processing_error='amount_mismatch')<>1
    then raise exception 'TEST amount mismatch not recorded'; end if;
  -- A bank-transfer idempotency key cannot be reused to create a card order.
  execute 'set local role service_role';
  select * into other from public.create_card_order(cart,'test@example.test','123456789',customer,address,rate,'',repeat('d',64),gen_random_uuid(),null,total);
  rejected:=false;
  begin perform public.create_card_order(cart,'test@example.test','123456789',customer,address,rate,'',repeat('9',64),key,null,total);
  exception when others then if sqlerrm='idempotency_conflict' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST card idempotency token conflict'; end if;
  execute 'reset role';
end;
$$;
rollback;
