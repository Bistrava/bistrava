begin;

-- NULL means that shipping VAT has not been calculated for this historical
-- order. Do not backfill, relabel it as zero or recalculate old invoices.
alter table public.orders
  add column shipping_tax_cents integer,
  add column shipping_tax_snapshot jsonb,
  add constraint orders_shipping_tax_consistent check (
    (shipping_tax_cents is null and shipping_tax_snapshot is null)
    or (shipping_tax_cents is not null and shipping_tax_snapshot is not null
      and shipping_tax_cents between 0 and shipping_cents
      and shipping_tax_cents <= tax_cents
      and coalesce(jsonb_typeof(shipping_tax_snapshot) = 'object'
        and shipping_tax_snapshot->>'version' = '1'
        and (shipping_tax_snapshot->>'shippingGrossCents')::integer = shipping_cents
        and (shipping_tax_snapshot->>'shippingTaxCents')::integer = shipping_tax_cents
        and (shipping_tax_snapshot->>'shippingNetCents')::integer = shipping_cents-shipping_tax_cents
        and jsonb_typeof(shipping_tax_snapshot->'breakdown') = 'array', false))
  );

comment on column public.orders.shipping_tax_cents is
  'VAT included in shipping_cents; NULL for historical orders not recalculated. Never added to total_cents.';
comment on column public.orders.shipping_tax_snapshot is
  'Immutable versioned allocation of gross shipping by snapshotted product VAT rates. NULL for historical orders.';

-- This pure internal function sees only persisted product snapshots. The
-- proportional mixed-rate policy and rounding must be approved by the merchant
-- and accountant before production use; it does not classify product VAT.
create schema if not exists private;
create function private.calculate_order_shipping_tax(input_items jsonb, input_shipping_cents integer)
returns jsonb language plpgsql immutable security invoker set search_path = '' as $$
declare
  rate_group record;
  product_gross bigint;
  rate_count integer;
  cumulative bigint := 0;
  allocated integer := 0;
  group_shipping integer;
  group_tax integer;
  shipping_tax integer := 0;
  basis text := 'discounted_products_gross';
  breakdown jsonb := '[]'::jsonb;
begin
  if input_shipping_cents is null or input_shipping_cents not between 0 and 100000000
    or input_items is null or jsonb_typeof(input_items) <> 'array' then
    raise exception 'invalid_shipping_tax_input';
  end if;
  if jsonb_array_length(input_items) not between 1 and 100 then raise exception 'invalid_shipping_tax_input'; end if;
  if exists(select 1 from jsonb_array_elements(input_items) item where
    jsonb_typeof(item) <> 'object'
    or coalesce(item->>'vatRate','') !~ '^[0-9]+([.][0-9]{1,2})?$'
    or coalesce(item->>'lineTotalCents','') !~ '^[0-9]+$'
    or coalesce(item->>'discountedLineTotalCents','') !~ '^[0-9]+$') then
    raise exception 'invalid_shipping_tax_input';
  end if;
  if exists(select 1 from jsonb_array_elements(input_items) item where
    (item->>'vatRate')::numeric not between 0 and 100
    or (item->>'lineTotalCents')::numeric not between 1 and 100000000
    or (item->>'discountedLineTotalCents')::numeric not between 0 and (item->>'lineTotalCents')::numeric) then
    raise exception 'invalid_shipping_tax_input';
  end if;
  select sum((item->>'discountedLineTotalCents')::bigint), count(distinct (item->>'vatRate')::numeric)
    into product_gross,rate_count from jsonb_array_elements(input_items) item;
  if product_gross > 100000000 then raise exception 'invalid_shipping_tax_input'; end if;
  if input_shipping_cents = 0 then
    basis := 'no_shipping_charge';
  elsif product_gross = 0 then
    if rate_count <> 1 then raise exception 'shipping_tax_allocation_requires_accountant_review'; end if;
    basis := 'single_rate_fully_discounted';
  end if;

  for rate_group in
    select (item->>'vatRate')::numeric as vat_rate,
      sum((item->>'discountedLineTotalCents')::bigint)::bigint as gross
    from jsonb_array_elements(input_items) item
    group by (item->>'vatRate')::numeric order by (item->>'vatRate')::numeric
  loop
    cumulative := cumulative + rate_group.gross;
    group_shipping := case
      when input_shipping_cents = 0 then 0
      when product_gross = 0 then input_shipping_cents
      else round(input_shipping_cents::numeric * cumulative / product_gross)::integer - allocated
    end;
    allocated := allocated + group_shipping;
    group_tax := round(group_shipping::numeric * rate_group.vat_rate / (100 + rate_group.vat_rate))::integer;
    shipping_tax := shipping_tax + group_tax;
    breakdown := breakdown || jsonb_build_array(jsonb_build_object(
      'vatRate',rate_group.vat_rate,'productsGrossCents',rate_group.gross,
      'shippingGrossCents',group_shipping,'shippingTaxCents',group_tax,
      'shippingNetCents',group_shipping-group_tax));
  end loop;
  return jsonb_build_object('version',1,
    'method','proportional_discounted_gross_by_vat_rate',
    'rounding','half_up_cumulative_gross_then_half_up_tax_per_rate',
    'allocationBasis',basis,'shippingGrossCents',input_shipping_cents,
    'shippingTaxCents',shipping_tax,'shippingNetCents',input_shipping_cents-shipping_tax,
    'breakdown',breakdown);
end;
$$;
revoke all on function private.calculate_order_shipping_tax(jsonb,integer) from public,anon,authenticated,service_role;

create function private.preserve_order_shipping_tax() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if old.shipping_tax_snapshot is not null
    and (new.shipping_tax_snapshot is distinct from old.shipping_tax_snapshot
      or new.shipping_tax_cents is distinct from old.shipping_tax_cents
      or new.shipping_cents is distinct from old.shipping_cents) then
    raise exception 'order_shipping_tax_immutable';
  end if;
  return new;
end;
$$;
revoke all on function private.preserve_order_shipping_tax() from public,anon,authenticated,service_role;
create trigger preserve_order_shipping_tax before update on public.orders
for each row execute function private.preserve_order_shipping_tax();

-- Keep stock, discounts, advisory locks, idempotency and quote/payment gross
-- totals unchanged. Only newly created orders receive the shipping tax share.
create or replace function public.create_pending_guest_order(
  input_cart_lines jsonb, input_email text, input_phone text, input_customer jsonb,
  input_shipping_address jsonb, input_shipping_rate_id uuid, input_customer_note text,
  input_guest_access_token_hash text, input_idempotency_key uuid,
  input_discount_code text, input_expected_total_cents integer
)
returns table(order_id uuid, order_reference text) language plpgsql security definer set search_path = '' as $$
declare
  existing_order public.orders%rowtype;
  created_order record;
  quote jsonb;
  item public.order_items%rowtype;
  subtotal integer;
  discount integer;
  cumulative bigint := 0;
  allocated integer := 0;
  item_discount integer;
  item_tax integer;
  tax_total integer := 0;
  shipping_allocation jsonb;
begin
  if input_idempotency_key is null or input_guest_access_token_hash is null or input_guest_access_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_guest_access_token'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(input_idempotency_key::text, 0));
  select * into existing_order from public.orders where checkout_idempotency_key = input_idempotency_key;
  if found then
    if existing_order.guest_access_token_hash is distinct from input_guest_access_token_hash then raise exception 'idempotency_conflict'; end if;
    return query select existing_order.id, existing_order.reference;
    return;
  end if;
  quote := public.calculate_guest_checkout_quote(input_cart_lines, input_shipping_rate_id, input_discount_code, true);
  if input_expected_total_cents is null or input_expected_total_cents <> (quote->>'totalCents')::integer then raise exception 'checkout_total_changed'; end if;
  select * into created_order from public.create_pending_guest_order_without_promotion(input_cart_lines, input_email, input_phone,
    input_customer, input_shipping_address, input_shipping_rate_id, input_customer_note, input_guest_access_token_hash, input_idempotency_key);
  subtotal := (quote->>'subtotalCents')::integer;
  discount := (quote->>'discountCents')::integer;
  -- Preserve the established per-line promotion allocation and VAT rounding.
  for item in select * from public.order_items where public.order_items.order_id = created_order.order_id order by sku, id
  loop
    cumulative := cumulative + item.line_total_cents;
    item_discount := round(discount::numeric * cumulative / subtotal)::integer - allocated;
    allocated := allocated + item_discount;
    item_tax := round((item.line_total_cents - item_discount)::numeric * (item.product_snapshot->>'vatRate')::numeric / (100 + (item.product_snapshot->>'vatRate')::numeric))::integer;
    tax_total := tax_total + item_tax;
    update public.order_items set tax_cents = item_tax,
      product_snapshot = product_snapshot || jsonb_build_object('discountCents', item_discount, 'discountedLineTotalCents', line_total_cents - item_discount)
    where id = item.id;
  end loop;
  select private.calculate_order_shipping_tax(jsonb_agg(product_snapshot), (quote->>'shippingCents')::integer)
    into shipping_allocation from public.order_items where public.order_items.order_id = created_order.order_id;
  update public.orders set discount_cents = discount, total_cents = (quote->>'totalCents')::integer,
    tax_cents = tax_total + (shipping_allocation->>'shippingTaxCents')::integer,
    shipping_tax_cents = (shipping_allocation->>'shippingTaxCents')::integer,
    shipping_tax_snapshot = shipping_allocation,
    discount_code_id = (quote->>'codeId')::uuid,
    discount_snapshot = case when quote->>'codeId' is not null then quote - array['subtotalCents', 'shippingCents', 'totalCents'] end
  where id = created_order.order_id;
  update public.payments set amount_cents = (quote->>'totalCents')::integer where public.payments.order_id = created_order.order_id;
  if quote->>'codeId' is not null then
    update public.discounts set used_count = used_count + 1 where id = (quote->>'discountId')::uuid;
    update public.discount_codes set used_count = used_count + 1 where id = (quote->>'codeId')::uuid;
  end if;
  return query select created_order.order_id::uuid, created_order.order_reference::text;
end;
$$;
revoke all on function public.create_pending_guest_order(jsonb,text,text,jsonb,jsonb,uuid,text,text,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.create_pending_guest_order(jsonb,text,text,jsonb,jsonb,uuid,text,text,uuid,text,integer) to service_role;

commit;
