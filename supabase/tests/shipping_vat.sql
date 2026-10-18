-- All fixtures, inventory reservations, financial snapshots and role changes
-- exist only inside this rolled-back transaction. No real customer or bank.
begin;

do $$
declare
  zone_id uuid := gen_random_uuid();
  paid_id uuid := gen_random_uuid();
  mixed_id uuid := gen_random_uuid();
  free_id uuid := gen_random_uuid();
  tiny_id uuid := gen_random_uuid();
  promotion_id uuid; full_promotion_id uuid;
  scenario record; result record; repeated record;
  saved public.orders%rowtype;
  quote jsonb; allocation jsonb; snapshot jsonb;
  key uuid; first_id uuid; first_key uuid;
  before_orders integer; before_stock integer; before_movements integer;
  rejected boolean;
  customer jsonb := '{"firstName":"VAT","lastName":"Local test"}';
  address jsonb := '{"countryCode":"SI","postalCode":"1000"}';
  mixed_cart jsonb := '[{"sku":"VAT-22","quantity":1},{"sku":"VAT-095","quantity":1}]';
  bank jsonb := '{"beneficiary":"LOCAL TEST ONLY","iban":"GB82WEST12345698765432","bankName":"Example bank","bic":"","currency":"EUR"}';
begin
  insert into public.shipping_zones(id,name,country_codes) values(zone_id,'VAT test only',array['SI']);
  insert into public.shipping_rates(id,zone_id,name,price_cents) values
    (paid_id,zone_id,'VAT paid',450), (mixed_id,zone_id,'VAT mixed',1220),
    (free_id,zone_id,'VAT free',0), (tiny_id,zone_id,'VAT tiny',1);
  insert into public.products(name,name_sl,slug,brand,short_description,status,published_at,sku,price_cents,vat_rate,sales_mode,stock_status,stock_quantity) values
    ('VAT test','VAT test','vat-22','Local','In-memory test only','active',now(),'VAT-22',12200,22,'buy_now','in_stock',99),
    ('VAT test','VAT test','vat-095','Local','In-memory test only','active',now(),'VAT-095',10950,9.5,'buy_now','in_stock',99),
    ('VAT test','VAT test','vat-zero','Local','In-memory test only','active',now(),'VAT-ZERO',1000,0,'buy_now','in_stock',99),
    ('VAT test','VAT test','vat-tiny22','Local','In-memory test only','active',now(),'VAT-TINY22',1,22,'buy_now','in_stock',99),
    ('VAT test','VAT test','vat-tiny095','Local','In-memory test only','active',now(),'VAT-TINY095',1,9.5,'buy_now','in_stock',99);
  insert into public.discounts(name,discount_type,value,active) values('VAT ten percent','percentage',10,true) returning id into promotion_id;
  insert into public.discount_codes(discount_id,code) values(promotion_id,'VAT10');
  insert into public.discounts(name,discount_type,value,active) values('VAT full discount','percentage',100,true) returning id into full_promotion_id;
  insert into public.discount_codes(discount_id,code) values(full_promotion_id,'VAT100');

  for scenario in select * from (values
    ('standard','[{"sku":"VAT-22","quantity":1}]'::jsonb,paid_id,null::text,12200,0,450,12650,2200,81,2281),
    ('reduced','[{"sku":"VAT-095","quantity":1}]'::jsonb,paid_id,null::text,10950,0,450,11400,950,39,989),
    ('zero','[{"sku":"VAT-ZERO","quantity":1}]'::jsonb,paid_id,null::text,1000,0,450,1450,0,0,0),
    ('mixed',mixed_cart,mixed_id,null::text,23150,0,1220,24370,3150,166,3316),
    ('mixed discount',mixed_cart,mixed_id,'VAT10',23150,2315,1220,22055,2835,166,3001),
    ('free shipping',mixed_cart,free_id,null::text,23150,0,0,23150,3150,0,3150),
    ('single fully discounted','[{"sku":"VAT-22","quantity":1}]'::jsonb,paid_id,'VAT100',12200,12200,450,450,0,81,81),
    ('mixed fully discounted free shipping',mixed_cart,free_id,'VAT100',23150,23150,0,0,0,0,0),
    ('one cent shipping','[{"sku":"VAT-TINY22","quantity":1},{"sku":"VAT-TINY095","quantity":1}]'::jsonb,tiny_id,null::text,2,0,1,3,0,0,0)
  ) as cases(name,cart,rate_id,code,subtotal,discount,shipping,total,product_tax,shipping_tax,total_tax)
  loop
    key := gen_random_uuid();
    quote := public.quote_guest_checkout(scenario.cart,scenario.rate_id,scenario.code);
    if (quote->>'totalCents')::integer <> scenario.total then raise exception 'TEST VAT quote changed TTC: %',scenario.name; end if;
    execute 'set local role service_role';
    select * into result from public.create_pending_guest_order(scenario.cart,'vat@example.test','123456789',customer,address,
      scenario.rate_id,'',repeat('d',64),key,scenario.code,scenario.total);
    execute 'reset role';
    select * into saved from public.orders where id=result.order_id;
    if saved.subtotal_cents<>scenario.subtotal or saved.discount_cents<>scenario.discount
      or saved.shipping_cents<>scenario.shipping or saved.total_cents<>scenario.total
      or saved.shipping_tax_cents<>scenario.shipping_tax or saved.tax_cents<>scenario.total_tax
      or saved.shipping_tax_snapshot is null then
      raise exception 'TEST VAT persisted amounts: %',scenario.name;
    end if;
    if (select sum(tax_cents) from public.order_items where order_id=saved.id)<>scenario.product_tax then
      raise exception 'TEST VAT changed product line tax: %',scenario.name;
    end if;
    if not exists(select 1 from public.payments where order_id=saved.id and amount_cents=scenario.total) then
      raise exception 'TEST VAT changed payment TTC: %',scenario.name;
    end if;
    snapshot := saved.shipping_tax_snapshot;
    if (snapshot->>'shippingGrossCents')::integer<>scenario.shipping
      or (snapshot->>'shippingTaxCents')::integer<>scenario.shipping_tax
      or (snapshot->>'shippingNetCents')::integer<>scenario.shipping-scenario.shipping_tax
      or (select sum((part->>'shippingGrossCents')::integer) from jsonb_array_elements(snapshot->'breakdown') part)<>scenario.shipping
      or (select sum((part->>'shippingTaxCents')::integer) from jsonb_array_elements(snapshot->'breakdown') part)<>scenario.shipping_tax then
      raise exception 'TEST VAT snapshot does not reconcile: %',scenario.name;
    end if;
    if scenario.name='standard' then first_id:=saved.id; first_key:=key; end if;
    if scenario.name='mixed' and snapshot->'breakdown' <> '[{"vatRate":9.5,"productsGrossCents":10950,"shippingGrossCents":577,"shippingTaxCents":50,"shippingNetCents":527},{"vatRate":22,"productsGrossCents":12200,"shippingGrossCents":643,"shippingTaxCents":116,"shippingNetCents":527}]'::jsonb then
      raise exception 'TEST VAT mixed-rate allocation differs';
    end if;
    if scenario.name='one cent shipping' and (snapshot->'breakdown'->0->>'shippingGrossCents')::integer<>1 then
      raise exception 'TEST VAT half-up cent allocation differs';
    end if;
  end loop;

  -- Reject the unresolved allocation without leaving an order, stock change,
  -- inventory movement, payment or consumed promotion use behind.
  select count(*) into before_orders from public.orders;
  select sum(stock_quantity) into before_stock from public.products where sku in ('VAT-22','VAT-095');
  select count(*) into before_movements from public.product_inventory_movements;
  rejected:=false;
  begin
    perform public.create_pending_guest_order(mixed_cart,'vat@example.test','123456789',customer,address,
      mixed_id,'',repeat('d',64),gen_random_uuid(),'VAT100',1220);
  exception when others then
    if sqlerrm='shipping_tax_allocation_requires_accountant_review' then rejected:=true; else raise; end if;
  end;
  if not rejected or (select count(*) from public.orders)<>before_orders
    or (select sum(stock_quantity) from public.products where sku in ('VAT-22','VAT-095'))<>before_stock
    or (select count(*) from public.product_inventory_movements)<>before_movements
    or (select used_count from public.discounts where id=full_promotion_id)<>2 then
    raise exception 'TEST VAT mixed full discount was accepted or left side effects';
  end if;

  -- An idempotent replay preserves historical prices, rates and fiscal data.
  select shipping_tax_snapshot into snapshot from public.orders where id=first_id;
  select stock_quantity into before_stock from public.products where sku='VAT-22';
  update public.products set vat_rate=9.5,price_cents=13000 where sku='VAT-22';
  update public.shipping_rates set price_cents=999 where id=paid_id;
  select * into repeated from public.create_pending_guest_order('[{"sku":"VAT-22","quantity":1}]','vat@example.test','123456789',customer,address,
    paid_id,'',repeat('d',64),first_key,null,13999);
  if repeated.order_id<>first_id or (select shipping_tax_snapshot from public.orders where id=first_id)<>snapshot
    or (select tax_cents from public.orders where id=first_id)<>2281
    or (select total_cents from public.orders where id=first_id)<>12650
    or (select stock_quantity from public.products where sku='VAT-22')<>before_stock then
    raise exception 'TEST VAT replay recalculated a snapshot or stock';
  end if;

  rejected:=false;
  begin update public.orders set shipping_tax_cents=0 where id=first_id;
  exception when others then if sqlerrm='order_shipping_tax_immutable' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST VAT shipping tax can be edited'; end if;
  rejected:=false;
  begin update public.orders set shipping_tax_snapshot=null where id=first_id;
  exception when others then if sqlerrm='order_shipping_tax_immutable' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST VAT snapshot can be cleared'; end if;
  rejected:=false;
  begin update public.orders set shipping_cents=451,total_cents=12651 where id=first_id;
  exception when others then if sqlerrm='order_shipping_tax_immutable' then rejected:=true; else raise; end if; end;
  if not rejected then raise exception 'TEST VAT shipping charge can invalidate snapshot'; end if;
  update public.orders set internal_note='Unrelated administrative edits still work' where id=first_id;

  -- The bank wrapper uses the same computation and remains strictly unpaid.
  update public.products set vat_rate=22,price_cents=12200 where sku='VAT-22';
  select * into result from public.create_bank_transfer_order('[{"sku":"VAT-22","quantity":1}]','vat@example.test','123456789',customer,address,
    mixed_id,'',repeat('e',64),gen_random_uuid(),null,13420,bank);
  if not exists(select 1 from public.orders where id=result.order_id and checkout_mode='bank_transfer'
      and status='awaiting_payment' and shipping_tax_cents=220 and tax_cents=2420 and total_cents=13420)
    or not exists(select 1 from public.payments where order_id=result.order_id and provider='bank_transfer' and status='pending' and amount_cents=13420) then
    raise exception 'TEST VAT bank transfer amount or tax differs';
  end if;

  -- No exposed role can call the internal allocator or trigger function.
  if has_function_privilege('anon','private.calculate_order_shipping_tax(jsonb,integer)','execute')
    or has_function_privilege('authenticated','private.calculate_order_shipping_tax(jsonb,integer)','execute')
    or has_function_privilege('service_role','private.calculate_order_shipping_tax(jsonb,integer)','execute')
    or has_function_privilege('anon','private.preserve_order_shipping_tax()','execute') then
    raise exception 'TEST VAT internal function is exposed';
  end if;

  -- Reordering or splitting lines at the same rate cannot change the shipping
  -- grouping; the allocator never uses mutable catalogue data or SKU order.
  allocation:=private.calculate_order_shipping_tax('[{"vatRate":22,"lineTotalCents":12200,"discountedLineTotalCents":12200},{"vatRate":9.5,"lineTotalCents":10950,"discountedLineTotalCents":10950}]',1220);
  if allocation<>private.calculate_order_shipping_tax('[{"vatRate":9.5,"lineTotalCents":10950,"discountedLineTotalCents":10950},{"vatRate":22,"lineTotalCents":6100,"discountedLineTotalCents":6100},{"vatRate":22,"lineTotalCents":6100,"discountedLineTotalCents":6100}]',1220) then
    raise exception 'TEST VAT shipping changed when same-rate lines split';
  end if;
end;
$$;

rollback;
