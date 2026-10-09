-- Isolated transactional checks; fixtures and role changes are always rolled back.
-- Run after migration 202610090017 with a database owner connection.
begin;

do $$
declare
  admin_id uuid; editor_id uuid; zone_id uuid; paid_id uuid; free_id uuid; legacy_id uuid;
  version timestamptz; saved public.shipping_rates%rowtype; quote jsonb; order_result record;
  rejected boolean; invalid_pair integer[]; test_sku text; discount_id uuid; code text;
begin
  select profile_id into admin_id from public.admin_roles where role = 'admin' and active limit 1;
  select profile_id into editor_id from public.admin_roles where role = 'editor' and active limit 1;
  if admin_id is null or editor_id is null then raise exception 'TEST active admin and editor fixtures required'; end if;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  zone_id := public.admin_save_shipping_zone(null, 'Shipping threshold test', true, null);
  paid_id := public.admin_save_shipping_rate(null, zone_id, 'Paid test', 450, null, null, true, null, null, 8000);
  free_id := public.admin_save_shipping_rate(null, zone_id, 'Free test', 0, null, null, true, null, 8001, null);
  select * into saved from public.shipping_rates where id = paid_id;
  if saved.max_order_cents <> 8000 or saved.min_order_cents is not null
    or saved.estimated_days_min is not null or saved.estimated_days_max is not null then
    raise exception 'TEST paid range or optional estimates not saved';
  end if;

  -- Older callers omit new parameters: creating an unbounded rate still works,
  -- and editing a bounded rate must never turn it into unrestricted free shipping.
  legacy_id := public.admin_save_shipping_rate(null, zone_id, 'Legacy test', 450, 2, 4, false, null);
  select * into saved from public.shipping_rates where id = legacy_id;
  if saved.min_order_cents is not null or saved.max_order_cents is not null then raise exception 'TEST legacy create acquired bounds'; end if;
  select updated_at into version from public.shipping_rates where id = free_id;
  perform public.admin_save_shipping_rate(free_id, zone_id, 'Free renamed', 0, null, null, true, version);
  if (select min_order_cents from public.shipping_rates where id = free_id) <> 8001 then raise exception 'TEST legacy edit cleared range'; end if;
  select updated_at into version from public.shipping_rates where id = legacy_id;
  perform public.admin_save_shipping_rate(legacy_id, zone_id, 'Single amount test', 0, 1, 1, false, version, 0, 0);
  select updated_at into version from public.shipping_rates where id = legacy_id;
  perform public.admin_save_shipping_rate(legacy_id, zone_id, 'Cleared bounds', 0, null, null, false, version, null, null);
  select * into saved from public.shipping_rates where id = legacy_id;
  if saved.min_order_cents is not null or saved.max_order_cents is not null then raise exception 'TEST explicit NULL cannot clear bounds'; end if;
  if not exists(select 1 from public.audit_logs where entity_id = free_id and after_data->>'min_order_cents' = '8001') then
    raise exception 'TEST range missing from audit';
  end if;

  rejected := false;
  begin perform public.admin_save_shipping_rate(free_id, zone_id, 'Stale test', 0, null, null, true, '2000-01-01', 8001, null);
  exception when others then if sqlerrm like '%shipping_conflict%' then rejected := true; else raise; end if; end;
  if not rejected then raise exception 'TEST stale edit accepted'; end if;
  foreach invalid_pair slice 1 in array array[[-1,8000],[-2,8000],[8001,8000],[0,-1]] loop
    rejected := false;
    begin perform public.admin_save_shipping_rate(null, zone_id, 'Invalid bounds', 0, null, null, false, null, invalid_pair[1], invalid_pair[2]);
    exception when others then if sqlerrm like '%invalid_shipping_rate%' then rejected := true; else raise; end if; end;
    if not rejected then raise exception 'TEST invalid range accepted: %', invalid_pair; end if;
  end loop;
  foreach invalid_pair slice 1 in array array[[null,3],[2,null],[0,3],[1,91],[4,2]] loop
    rejected := false;
    begin perform public.admin_save_shipping_rate(null, zone_id, 'Invalid days', 0, invalid_pair[1], invalid_pair[2], false, null, null, null);
    exception when others then if sqlerrm like '%invalid_shipping_rate%' then rejected := true; else raise; end if; end;
    if not rejected then raise exception 'TEST invalid estimate accepted: %', invalid_pair; end if;
  end loop;

  perform set_config('request.jwt.claim.sub', editor_id::text, true);
  rejected := false;
  begin perform public.admin_save_shipping_rate(null, zone_id, 'Forbidden edit', 0, null, null, true, null, 0, null);
  exception when others then if sqlerrm like '%admin_required%' then rejected := true; else raise; end if; end;
  if not rejected then raise exception 'TEST editor can create shipping rate'; end if;
  execute 'reset role';
  if has_function_privilege('anon', 'public.admin_save_shipping_rate(uuid,uuid,text,integer,integer,integer,boolean,timestamptz,integer,integer)', 'execute') then
    raise exception 'TEST anonymous role can execute shipping mutation';
  end if;
  if (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname = 'admin_save_shipping_rate') <> 1 then
    raise exception 'TEST ambiguous RPC overload';
  end if;

  -- Constraints protect even writes that bypass the admin RPC.
  rejected := false;
  begin update public.shipping_rates set min_order_cents = -1 where id = free_id;
  exception when check_violation then rejected := true; end;
  if not rejected then raise exception 'TEST negative range bypassed table constraint'; end if;
  rejected := false;
  begin update public.shipping_rates set estimated_days_min = 2, estimated_days_max = null where id = free_id;
  exception when check_violation then rejected := true; end;
  if not rejected then raise exception 'TEST partial estimate bypassed table constraint'; end if;

  test_sku := 'SHIPPING-TEST-' || gen_random_uuid()::text;
  insert into public.products(name,name_sl,slug,brand,short_description,status,published_at,sku,price_cents,sales_mode,stock_status,stock_quantity)
  values('Shipping test','Shipping test',lower(test_sku),'Local','Transactional test only','active',now(),test_sku,7999,'buy_now','in_stock',15);
  quote := public.quote_guest_checkout(jsonb_build_array(jsonb_build_object('sku',test_sku,'quantity',1)), paid_id, null);
  if (quote->>'shippingCents')::integer <> 450 or (quote->>'totalCents')::integer <> 8449 then raise exception 'TEST 79.99 boundary'; end if;
  update public.products set price_cents = 8000 where sku = test_sku;
  quote := public.quote_guest_checkout(jsonb_build_array(jsonb_build_object('sku',test_sku,'quantity',1)), paid_id, null);
  if (quote->>'shippingCents')::integer <> 450 or (quote->>'totalCents')::integer <> 8450 then raise exception 'TEST 80.00 boundary'; end if;
  rejected := false;
  begin perform public.quote_guest_checkout(jsonb_build_array(jsonb_build_object('sku',test_sku,'quantity',1)), free_id, null);
  exception when others then if sqlerrm like '%shipping_rate_unavailable%' then rejected := true; else raise; end if; end;
  if not rejected then raise exception 'TEST forged free shipping under threshold accepted'; end if;
  update public.products set price_cents = 8001 where sku = test_sku;
  quote := public.quote_guest_checkout(jsonb_build_array(jsonb_build_object('sku',test_sku,'quantity',1)), free_id, null);
  if (quote->>'shippingCents')::integer <> 0 or (quote->>'totalCents')::integer <> 8001 then raise exception 'TEST 80.01 boundary'; end if;
  rejected := false;
  begin perform public.quote_guest_checkout(jsonb_build_array(jsonb_build_object('sku',test_sku,'quantity',1)), paid_id, null);
  exception when others then if sqlerrm like '%shipping_rate_unavailable%' then rejected := true; else raise; end if; end;
  if not rejected then raise exception 'TEST paid shipping beyond its upper bound accepted'; end if;

  code := 'SHIP' || upper(replace(gen_random_uuid()::text,'-',''));
  insert into public.discounts(name,discount_type,value,active) values('Shipping test','percentage',50,true) returning id into discount_id;
  insert into public.discount_codes(discount_id,code) values(discount_id,code);
  quote := public.quote_guest_checkout(jsonb_build_array(jsonb_build_object('sku',test_sku,'quantity',1)), free_id, code);
  if (quote->>'shippingCents')::integer <> 0 or (quote->>'discountCents')::integer <> 4001
    or (quote->>'totalCents')::integer <> 4000 then raise exception 'TEST promotion changed pre-discount eligibility'; end if;
  select * into order_result from public.create_pending_guest_order(
    jsonb_build_array(jsonb_build_object('sku',test_sku,'quantity',1)), 'shipping@example.test', '+38640000000',
    '{"firstName":"Shipping","lastName":"Test"}'::jsonb, '{"countryCode":"SI","postalCode":"1000"}'::jsonb,
    free_id, '', repeat('a',64), gen_random_uuid(), code, 4000
  );
  if not exists(select 1 from public.orders where id = order_result.order_id and subtotal_cents = 8001 and discount_cents = 4001 and shipping_cents = 0 and total_cents = 4000)
    or not exists(select 1 from public.payments where order_id = order_result.order_id and amount_cents = 4000) then
    raise exception 'TEST persisted shipping, order total and payment differ from quote';
  end if;
end;
$$;

rollback;
