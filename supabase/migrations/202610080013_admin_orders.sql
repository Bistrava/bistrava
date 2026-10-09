begin;

-- All order, payment, shipment and reservation changes form one transaction.
create or replace function public.admin_save_order(
  input_order_id uuid,
  input_expected_updated_at timestamptz,
  input_status public.order_status,
  input_internal_note text,
  input_shipment jsonb default null,
  input_payment_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_order public.orders%rowtype;
  payment_record public.payments%rowtype;
  shipment_record public.shipments%rowtype;
  reservation record;
  next_shipment_status public.shipment_status;
  next_carrier text;
  next_tracking text;
  next_tracking_url text;
  next_balance integer;
  payment_reference text := nullif(btrim(input_payment_reference), '');
begin
  if not public.has_admin_role(array['admin']::public.admin_role[]) then
    raise exception 'admin_required';
  end if;
  if input_status is null or char_length(coalesce(input_internal_note, '')) > 5000 then
    raise exception 'invalid_order_input';
  end if;
  select * into previous_order from public.orders where id = input_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if input_expected_updated_at is null or previous_order.updated_at <> input_expected_updated_at then
    raise exception 'order_conflict';
  end if;

  select * into payment_record from public.payments
  where order_id = input_order_id order by created_at desc, id desc limit 1 for update;
  select * into shipment_record from public.shipments
  where order_id = input_order_id order by created_at desc, id desc limit 1 for update;

  if input_status <> previous_order.status and not (
    (previous_order.status = 'pending' and input_status in ('awaiting_payment', 'cancelled', 'paid')) or
    (previous_order.status = 'awaiting_payment' and input_status in ('pending', 'cancelled', 'paid')) or
    (previous_order.status = 'paid' and input_status = 'processing') or
    (previous_order.status = 'processing' and input_status = 'shipped') or
    (previous_order.status = 'shipped' and input_status = 'completed')
  ) then raise exception 'invalid_order_transition'; end if;

  if input_status = 'paid' and previous_order.status <> 'paid' then
    if payment_reference is null or char_length(payment_reference) < 3 or char_length(payment_reference) > 200
      or payment_record.id is null or payment_record.provider <> 'manual_review'
      or payment_record.status not in ('pending', 'requires_action')
      or payment_record.amount_cents <> previous_order.total_cents then
      raise exception 'payment_confirmation_required';
    end if;
    update public.payments set status = 'paid', provider_reference = payment_reference, paid_at = now()
    where id = payment_record.id;
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
    values(auth.uid(), 'payment.manual_receipt_confirmed', 'payment', payment_record.id,
      jsonb_build_object('status', payment_record.status),
      jsonb_build_object('status', 'paid', 'reference', payment_reference, 'amount_cents', payment_record.amount_cents));
  elsif payment_reference is not null then
    raise exception 'invalid_payment_confirmation';
  end if;

  if input_status in ('processing', 'shipped', 'completed') and input_status <> previous_order.status then
    if payment_record.id is null or payment_record.status <> 'paid'
      or payment_record.refunded_cents > 0 or payment_record.amount_cents <> previous_order.total_cents then
      raise exception 'paid_order_required';
    end if;
  end if;

  if input_status = 'cancelled' and previous_order.status <> 'cancelled' then
    if exists(select 1 from public.payments where order_id = input_order_id and status in ('authorized', 'paid', 'partially_refunded', 'refunded'))
      or exists(select 1 from public.shipments where order_id = input_order_id and status not in ('pending', 'ready', 'cancelled')) then
      raise exception 'cancellation_requires_review';
    end if;
    -- Only release outstanding reservations created by the checkout, never
    -- infer inventory from editable item descriptions or return stock twice.
    for reservation in
      select product_id, -sum(quantity_delta)::integer as quantity
      from public.product_inventory_movements
      where order_id = input_order_id and reason in ('reservation', 'release')
      group by product_id having sum(quantity_delta) < 0 order by product_id
    loop
      update public.products set stock_quantity = stock_quantity + reservation.quantity,
        stock_status = case when stock_status = 'out_of_stock' then 'in_stock'::public.stock_status else stock_status end
      where id = reservation.product_id returning stock_quantity into next_balance;
      insert into public.product_inventory_movements(product_id, order_id, reason, quantity_delta, balance_after, note)
      values(reservation.product_id, input_order_id, 'release', reservation.quantity, next_balance, 'Sprostitev rezervacije ob preklicu naročila');
    end loop;
    update public.payments set status = 'cancelled' where order_id = input_order_id and status in ('pending', 'requires_action', 'failed');
    update public.shipments set status = 'cancelled' where order_id = input_order_id and status in ('pending', 'ready');
  elsif input_shipment is not null then
    if jsonb_typeof(input_shipment) <> 'object' then raise exception 'invalid_shipment'; end if;
    if previous_order.status in ('cancelled', 'refunded', 'partially_refunded') then raise exception 'invalid_shipment_transition'; end if;
    if coalesce(input_shipment->>'status', '') not in ('pending', 'ready', 'shipped', 'in_transit', 'delivered') then
      raise exception 'invalid_shipment';
    end if;
    next_shipment_status := (input_shipment->>'status')::public.shipment_status;
    next_carrier := nullif(btrim(input_shipment->>'carrier'), '');
    next_tracking := nullif(btrim(input_shipment->>'trackingNumber'), '');
    next_tracking_url := nullif(btrim(input_shipment->>'trackingUrl'), '');
    if char_length(coalesce(next_carrier, '')) > 120 or char_length(coalesce(next_tracking, '')) > 200
      or char_length(coalesce(input_shipment->>'service', '')) > 120
      or char_length(coalesce(next_tracking_url, '')) > 1000
      or (next_tracking_url is not null and next_tracking_url !~ '^https://[^[:space:]]+$') then
      raise exception 'invalid_shipment';
    end if;
    if (input_status in ('pending', 'awaiting_payment', 'paid', 'processing') and next_shipment_status not in ('pending', 'ready'))
      or (input_status = 'shipped' and next_shipment_status not in ('shipped', 'in_transit'))
      or (input_status = 'completed' and next_shipment_status <> 'delivered') then
      raise exception 'shipment_status_mismatch';
    end if;
    if (shipment_record.status = 'delivered' and next_shipment_status <> 'delivered')
      or (shipment_record.status = 'in_transit' and next_shipment_status not in ('in_transit', 'delivered'))
      or (shipment_record.status = 'shipped' and next_shipment_status not in ('shipped', 'in_transit', 'delivered'))
      or shipment_record.status in ('returned', 'cancelled') then
      raise exception 'invalid_shipment_transition';
    end if;
    if next_shipment_status in ('shipped', 'in_transit', 'delivered') and (next_carrier is null or next_tracking is null) then
      raise exception 'tracking_required';
    end if;
    if shipment_record.id is null then
      insert into public.shipments(order_id, status, carrier, service, tracking_number, tracking_url, shipping_address_snapshot, shipped_at, delivered_at)
      values(input_order_id, next_shipment_status, next_carrier, nullif(btrim(input_shipment->>'service'), ''), next_tracking, next_tracking_url,
        previous_order.shipping_address_snapshot,
        case when next_shipment_status in ('shipped', 'in_transit', 'delivered') then now() end,
        case when next_shipment_status = 'delivered' then now() end);
    else
      update public.shipments set status = next_shipment_status, carrier = next_carrier,
        service = nullif(btrim(input_shipment->>'service'), ''), tracking_number = next_tracking, tracking_url = next_tracking_url,
        shipped_at = coalesce(shipped_at, case when next_shipment_status in ('shipped', 'in_transit', 'delivered') then now() end),
        delivered_at = coalesce(delivered_at, case when next_shipment_status = 'delivered' then now() end)
      where id = shipment_record.id;
    end if;
  elsif input_status in ('shipped', 'completed') and input_status <> previous_order.status then
    raise exception 'shipment_required';
  end if;

  update public.orders set status = input_status, internal_note = nullif(btrim(input_internal_note), ''),
    cancelled_at = case when input_status = 'cancelled' then coalesce(cancelled_at, now()) else cancelled_at end,
    completed_at = case when input_status = 'completed' then coalesce(completed_at, now()) else completed_at end,
    reservation_expires_at = case when input_status in ('paid', 'cancelled') then null else reservation_expires_at end
  where id = input_order_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(auth.uid(), 'order.updated', 'order', input_order_id,
    jsonb_build_object('status', previous_order.status, 'internal_note', previous_order.internal_note, 'shipment', to_jsonb(shipment_record)),
    jsonb_build_object('status', input_status, 'internal_note', nullif(btrim(input_internal_note), ''), 'shipment', input_shipment));
  return input_order_id;
end;
$$;

revoke all on function public.admin_save_order(uuid, timestamptz, public.order_status, text, jsonb, text) from public, anon;
grant execute on function public.admin_save_order(uuid, timestamptz, public.order_status, text, jsonb, text) to authenticated;

create or replace function public.admin_save_shipping_zone(
  input_id uuid, input_name text, input_active boolean, input_expected_updated_at timestamptz default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  saved_id uuid;
  previous public.shipping_zones%rowtype;
begin
  if not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required'; end if;
  if input_name is null or char_length(btrim(input_name)) not between 2 and 120 or input_active is null then raise exception 'invalid_shipping_zone'; end if;
  if input_id is null then
    insert into public.shipping_zones(name, country_codes, active) values(btrim(input_name), array['SI'], input_active) returning id into saved_id;
  else
    select * into previous from public.shipping_zones where id = input_id for update;
    if not found then raise exception 'shipping_not_found'; end if;
    if input_expected_updated_at is null or previous.updated_at <> input_expected_updated_at then raise exception 'shipping_conflict'; end if;
    if previous.country_codes <> array['SI']::text[] or cardinality(previous.postal_code_patterns) > 0 then raise exception 'unsupported_shipping_zone'; end if;
    update public.shipping_zones set name = btrim(input_name), active = input_active where id = input_id returning id into saved_id;
  end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(auth.uid(), 'shipping_zone.saved', 'shipping_zone', saved_id, to_jsonb(previous), jsonb_build_object('name', btrim(input_name), 'active', input_active));
  return saved_id;
end;
$$;

create or replace function public.admin_save_shipping_rate(
  input_id uuid, input_zone_id uuid, input_name text, input_price_cents integer,
  input_days_min integer, input_days_max integer, input_active boolean,
  input_expected_updated_at timestamptz default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  saved_id uuid;
  previous public.shipping_rates%rowtype;
begin
  if not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required'; end if;
  if input_name is null or char_length(btrim(input_name)) not between 2 and 120 or input_price_cents is null
    or input_price_cents not between 0 and 9999999 or input_days_min is null or input_days_max is null
    or input_days_min not between 1 and 90 or input_days_max not between input_days_min and 90 or input_active is null then
    raise exception 'invalid_shipping_rate';
  end if;
  perform id from public.shipping_zones where id = input_zone_id and country_codes = array['SI']::text[]
    and cardinality(postal_code_patterns) = 0 for share;
  if not found then raise exception 'unsupported_shipping_zone'; end if;
  if input_id is null then
    insert into public.shipping_rates(zone_id, name, price_cents, estimated_days_min, estimated_days_max, active)
    values(input_zone_id, btrim(input_name), input_price_cents, input_days_min, input_days_max, input_active) returning id into saved_id;
  else
    select * into previous from public.shipping_rates where id = input_id for update;
    if not found then raise exception 'shipping_not_found'; end if;
    if input_expected_updated_at is null or previous.updated_at <> input_expected_updated_at then raise exception 'shipping_conflict'; end if;
    if previous.min_order_cents is not null or previous.max_order_cents is not null then raise exception 'unsupported_shipping_rate'; end if;
    update public.shipping_rates set zone_id = input_zone_id, name = btrim(input_name), price_cents = input_price_cents,
      estimated_days_min = input_days_min, estimated_days_max = input_days_max, active = input_active
    where id = input_id returning id into saved_id;
  end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(auth.uid(), 'shipping_rate.saved', 'shipping_rate', saved_id, to_jsonb(previous),
    jsonb_build_object('name', btrim(input_name), 'price_cents', input_price_cents, 'zone_id', input_zone_id, 'active', input_active,
      'estimated_days_min', input_days_min, 'estimated_days_max', input_days_max));
  return saved_id;
end;
$$;

revoke all on function public.admin_save_shipping_zone(uuid, text, boolean, timestamptz) from public, anon;
revoke all on function public.admin_save_shipping_rate(uuid, uuid, text, integer, integer, integer, boolean, timestamptz) from public, anon;
grant execute on function public.admin_save_shipping_zone(uuid, text, boolean, timestamptz) to authenticated;
grant execute on function public.admin_save_shipping_rate(uuid, uuid, text, integer, integer, integer, boolean, timestamptz) to authenticated;

commit;
