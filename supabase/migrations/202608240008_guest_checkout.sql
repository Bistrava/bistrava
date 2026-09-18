begin;

alter table public.orders
  add column guest_access_token_hash text,
  add column checkout_idempotency_key uuid unique,
  add column shipping_rate_id uuid references public.shipping_rates(id) on delete restrict,
  add column checkout_mode text not null default 'manual_review',
  add column reservation_expires_at timestamptz;

alter table public.orders
  add constraint orders_guest_access_hash_valid check (
    guest_access_token_hash is null or char_length(guest_access_token_hash) = 64
  ),
  add constraint orders_checkout_mode_valid check (checkout_mode in ('manual_review'));

create table public.product_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  reason public.inventory_reason not null,
  quantity_delta integer not null,
  balance_after integer not null,
  note text,
  created_at timestamptz not null default now(),
  constraint product_inventory_delta_nonzero check (quantity_delta <> 0),
  constraint product_inventory_balance_nonnegative check (balance_after >= 0)
);

create index product_inventory_movements_product_created_idx
  on public.product_inventory_movements(product_id, created_at desc);
create index orders_guest_reference_idx
  on public.orders(reference, guest_access_token_hash)
  where guest_access_token_hash is not null;

alter table public.product_inventory_movements enable row level security;
create policy "product_inventory_staff_read" on public.product_inventory_movements
for select to authenticated using (public.has_admin_role());
create policy "product_inventory_staff_insert" on public.product_inventory_movements
for insert to authenticated with check (public.has_admin_role());

create function public.create_pending_guest_order(
  input_cart_lines jsonb,
  input_email text,
  input_phone text,
  input_customer jsonb,
  input_shipping_address jsonb,
  input_shipping_rate_id uuid,
  input_customer_note text,
  input_guest_access_token_hash text,
  input_idempotency_key uuid
)
returns table(order_id uuid, order_reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_order record;
  requested_line record;
  product_record record;
  shipping_record record;
  created_order_id uuid;
  created_reference text;
  subtotal integer := 0;
  tax_total integer := 0;
  line_total integer;
  final_total integer;
  item_snapshots jsonb := '[]'::jsonb;
  item_snapshot jsonb;
begin
  if input_guest_access_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_guest_access_token';
  end if;
  if jsonb_typeof(input_cart_lines) <> 'array'
    or jsonb_array_length(input_cart_lines) < 1
    or jsonb_array_length(input_cart_lines) > 100 then
    raise exception 'invalid_cart';
  end if;

  select o.id, o.reference into existing_order
  from public.orders o
  where o.checkout_idempotency_key = input_idempotency_key;
  if found then
    return query select existing_order.id, existing_order.reference;
    return;
  end if;

  select sr.id, sr.price_cents, sr.currency into shipping_record
  from public.shipping_rates sr
  join public.shipping_zones sz on sz.id = sr.zone_id
  where sr.id = input_shipping_rate_id
    and sr.active = true
    and sz.active = true
    and 'SI' = any(sz.country_codes)
    and sr.currency = 'EUR';
  if not found then
    raise exception 'shipping_rate_unavailable';
  end if;

  for requested_line in
    select item.sku, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(input_cart_lines) as item(sku text, quantity integer)
    group by item.sku
  loop
    if requested_line.sku is null
      or requested_line.quantity is null
      or requested_line.quantity < 1
      or requested_line.quantity > 99 then
      raise exception 'invalid_cart_line';
    end if;

    select p.* into product_record
    from public.products p
    where p.sku = requested_line.sku
    for update;

    if not found
      or product_record.status <> 'active'
      or product_record.archived_at is not null
      or product_record.published_at is null
      or product_record.published_at > now()
      or product_record.sales_mode <> 'buy_now'
      or product_record.price_cents is null
      or product_record.stock_status <> 'in_stock'
      or product_record.stock_quantity < requested_line.quantity then
      raise exception 'product_unavailable:%', requested_line.sku;
    end if;

    line_total := product_record.price_cents * requested_line.quantity;
    subtotal := subtotal + line_total;
    tax_total := tax_total + round(
      line_total * product_record.vat_rate / (100 + product_record.vat_rate)
    )::integer;
    item_snapshot := jsonb_build_object(
      'productId', product_record.id,
      'name', coalesce(product_record.name_sl, product_record.name),
      'sku', product_record.sku,
      'brand', product_record.brand,
      'quantity', requested_line.quantity,
      'unitPriceCents', product_record.price_cents,
      'vatRate', product_record.vat_rate,
      'lineTotalCents', line_total
    );
    item_snapshots := item_snapshots || jsonb_build_array(item_snapshot);
  end loop;

  final_total := subtotal + shipping_record.price_cents;
  created_order_id := gen_random_uuid();
  created_reference := 'BIS-' || to_char(clock_timestamp(), 'YYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.orders (
    id, reference, status, email, phone, currency, subtotal_cents,
    discount_cents, shipping_cents, tax_cents, total_cents,
    billing_address_snapshot, shipping_address_snapshot, customer_note,
    guest_access_token_hash, checkout_idempotency_key, shipping_rate_id,
    checkout_mode, reservation_expires_at, placed_at
  ) values (
    created_order_id, created_reference, 'pending', lower(input_email), input_phone,
    'EUR', subtotal, 0, shipping_record.price_cents, tax_total, final_total,
    input_shipping_address || input_customer,
    input_shipping_address || input_customer,
    nullif(input_customer_note, ''), input_guest_access_token_hash,
    input_idempotency_key, input_shipping_rate_id, 'manual_review',
    now() + interval '48 hours', now()
  );

  for item_snapshot in select value from jsonb_array_elements(item_snapshots)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, variant_name, sku, product_snapshot,
      quantity, unit_price_cents, tax_cents, line_total_cents
    ) values (
      created_order_id,
      (item_snapshot ->> 'productId')::uuid,
      item_snapshot ->> 'name',
      'Standardna izvedba',
      item_snapshot ->> 'sku',
      item_snapshot,
      (item_snapshot ->> 'quantity')::integer,
      (item_snapshot ->> 'unitPriceCents')::integer,
      round(
        (item_snapshot ->> 'lineTotalCents')::integer *
        (item_snapshot ->> 'vatRate')::numeric /
        (100 + (item_snapshot ->> 'vatRate')::numeric)
      )::integer,
      (item_snapshot ->> 'lineTotalCents')::integer
    );

    update public.products
    set
      stock_quantity = stock_quantity - (item_snapshot ->> 'quantity')::integer,
      stock_status = case
        when stock_quantity - (item_snapshot ->> 'quantity')::integer = 0
          then 'out_of_stock'::public.stock_status
        else stock_status
      end
    where id = (item_snapshot ->> 'productId')::uuid;

    insert into public.product_inventory_movements (
      product_id, order_id, reason, quantity_delta, balance_after, note
    )
    select
      p.id, created_order_id, 'reservation',
      -((item_snapshot ->> 'quantity')::integer), p.stock_quantity,
      'Rezervacija ob oddaji spletnega naročila'
    from public.products p
    where p.id = (item_snapshot ->> 'productId')::uuid;
  end loop;

  insert into public.payments (
    order_id, provider, status, amount_cents, currency, idempotency_key
  ) values (
    created_order_id, 'manual_review', 'pending', final_total, 'EUR',
    'checkout:' || input_idempotency_key::text
  );

  return query select created_order_id, created_reference;
end;
$$;

revoke all on function public.create_pending_guest_order(
  jsonb, text, text, jsonb, jsonb, uuid, text, text, uuid
) from public, anon, authenticated;
grant execute on function public.create_pending_guest_order(
  jsonb, text, text, jsonb, jsonb, uuid, text, text, uuid
) to service_role;

commit;
