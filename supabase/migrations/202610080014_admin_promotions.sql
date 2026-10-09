begin;

-- Editors may inspect campaigns; financial mutations require an administrator.
drop policy if exists discounts_staff_all on public.discounts;
drop policy if exists discount_codes_staff_all on public.discount_codes;
create policy discounts_staff_read on public.discounts for select to authenticated using (public.has_admin_role());
create policy discount_codes_staff_read on public.discount_codes for select to authenticated using (public.has_admin_role());
-- Writes go through the audited functions below, including for administrators.
revoke insert, update, delete on public.discounts, public.discount_codes from anon, authenticated;

alter table public.orders
  add column discount_code_id uuid references public.discount_codes(id) on delete restrict,
  add column discount_snapshot jsonb,
  add column discount_released_at timestamptz;
create index orders_discount_code_idx on public.orders(discount_code_id) where discount_code_id is not null;

create function public.save_admin_promotion(input_promotion jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  saved_id uuid := (input_promotion->>'id')::uuid;
  code_id uuid := (input_promotion->>'code_id')::uuid;
  previous public.discounts%rowtype;
  previous_code public.discount_codes%rowtype;
  next_name text := btrim(input_promotion->>'name');
  next_code text := upper(btrim(input_promotion->>'code'));
  next_type text := input_promotion->>'discount_type';
  next_value integer := (input_promotion->>'value')::integer;
  next_active boolean := (input_promotion->>'active')::boolean;
  next_code_active boolean := (input_promotion->>'code_active')::boolean;
  next_start timestamptz := (input_promotion->>'starts_at')::timestamptz;
  next_end timestamptz := (input_promotion->>'ends_at')::timestamptz;
  next_min integer := (input_promotion->>'minimum_order_cents')::integer;
  next_limit integer := (input_promotion->>'usage_limit')::integer;
  next_code_limit integer := (input_promotion->>'code_usage_limit')::integer;
begin
  if not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required'; end if;
  if jsonb_typeof(input_promotion) <> 'object' or next_name is null or char_length(next_name) not between 2 and 120
    or char_length(coalesce(input_promotion->>'description', '')) > 1000
    or next_code is null or next_code !~ '^[A-Z0-9_-]{3,40}$'
    or next_type is null or next_type not in ('fixed', 'percentage')
    or next_value is null or next_value not between 1 and 100000000
    or (next_type = 'percentage' and next_value > 100)
    or next_active is null or next_code_active is null
    or (next_start is not null and next_end is not null and next_end <= next_start)
    or (next_min is not null and next_min not between 0 and 100000000)
    or (next_limit is not null and next_limit not between 0 and 1000000)
    or (next_code_limit is not null and next_code_limit not between 0 and 1000000) then raise exception 'invalid_promotion'; end if;
  if saved_id is null then
    if code_id is not null then raise exception 'invalid_promotion'; end if;
    insert into public.discounts(name, description, discount_type, value, starts_at, ends_at, minimum_order_cents, usage_limit, active)
    values(next_name, nullif(btrim(input_promotion->>'description'), ''), next_type, next_value, next_start, next_end, next_min, next_limit, next_active)
    returning id into saved_id;
  else
    select * into previous from public.discounts where id = saved_id for update;
    if not found or previous.archived_at is not null or previous.rules <> '{}'::jsonb then raise exception 'promotion_conflict'; end if;
    if (input_promotion->>'expected_updated_at')::timestamptz is null
      or previous.updated_at <> (input_promotion->>'expected_updated_at')::timestamptz then raise exception 'promotion_conflict'; end if;
    if next_limit is not null and next_limit < previous.used_count then raise exception 'usage_limit_below_used'; end if;
    update public.discounts set name = next_name, description = nullif(btrim(input_promotion->>'description'), ''),
      discount_type = next_type, value = next_value, starts_at = next_start, ends_at = next_end,
      minimum_order_cents = next_min, usage_limit = next_limit, active = next_active
    where id = saved_id;
  end if;
  if code_id is null then
    insert into public.discount_codes(discount_id, code, active, usage_limit)
    values(saved_id, next_code, next_code_active, next_code_limit) returning id into code_id;
  else
    select * into previous_code from public.discount_codes where id = code_id and discount_id = saved_id for update;
    if not found then raise exception 'promotion_conflict'; end if;
    if next_code_limit is not null and next_code_limit < previous_code.used_count then raise exception 'usage_limit_below_used'; end if;
    update public.discount_codes set code = next_code, active = next_code_active, usage_limit = next_code_limit where id = code_id;
  end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(auth.uid(), 'promotion.saved', 'discount', saved_id,
    jsonb_build_object('promotion', to_jsonb(previous), 'code', to_jsonb(previous_code)),
    input_promotion || jsonb_build_object('id', saved_id, 'code_id', code_id));
  return saved_id;
end;
$$;

create function public.archive_admin_promotion(input_id uuid, input_expected_updated_at timestamptz)
returns uuid language plpgsql security definer set search_path = '' as $$
declare previous public.discounts%rowtype;
begin
  if not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required'; end if;
  select * into previous from public.discounts where id = input_id for update;
  if not found or input_expected_updated_at is null or previous.updated_at <> input_expected_updated_at then raise exception 'promotion_conflict'; end if;
  update public.discounts set active = false, archived_at = coalesce(archived_at, now()) where id = input_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(auth.uid(), 'promotion.archived', 'discount', input_id, to_jsonb(previous), jsonb_build_object('active', false, 'archived_at', now()));
  return input_id;
end;
$$;
revoke all on function public.save_admin_promotion(jsonb), public.archive_admin_promotion(uuid, timestamptz) from public, anon;
grant execute on function public.save_admin_promotion(jsonb), public.archive_admin_promotion(uuid, timestamptz) to authenticated;

-- A private quote validates the entire basket. The optional locks are used by
-- checkout, in the same order as administrative cancellation: products, campaign, code.
create function public.calculate_guest_checkout_quote(input_cart_lines jsonb, input_shipping_rate_id uuid, input_discount_code text, input_lock boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  requested record;
  product_record public.products%rowtype;
  shipping_record public.shipping_rates%rowtype;
  campaign public.discounts%rowtype;
  code_record public.discount_codes%rowtype;
  subtotal bigint := 0;
  reduction integer := 0;
  normalized_code text := nullif(upper(btrim(input_discount_code)), '');
begin
  if input_cart_lines is null or jsonb_typeof(input_cart_lines) <> 'array' then raise exception 'invalid_cart'; end if;
  if jsonb_array_length(input_cart_lines) not between 1 and 100 then raise exception 'invalid_cart'; end if;
  if exists(select 1 from jsonb_array_elements(input_cart_lines) i where
    jsonb_typeof(i) <> 'object' or coalesce(i->>'sku', '') !~ '^[A-Za-z0-9_-]{2,64}$'
    or coalesce(i->>'quantity', '') !~ '^[1-9][0-9]?$') then raise exception 'invalid_cart_line'; end if;
  if input_lock then
    perform p.id from public.products p join (select distinct i->>'sku' as sku from jsonb_array_elements(input_cart_lines) i) r on p.sku = r.sku order by p.id for update of p;
    perform sz.id from public.shipping_zones sz join public.shipping_rates sr on sr.zone_id = sz.id where sr.id = input_shipping_rate_id for share of sz;
    perform sr.id from public.shipping_rates sr where sr.id = input_shipping_rate_id for share;
  end if;
  select sr.* into shipping_record from public.shipping_rates sr join public.shipping_zones sz on sz.id = sr.zone_id
  where sr.id = input_shipping_rate_id and sr.active and sz.active and 'SI' = any(sz.country_codes)
    and cardinality(sz.postal_code_patterns) = 0 and sr.currency = 'EUR';
  if not found then raise exception 'shipping_rate_unavailable'; end if;
  for requested in select item.sku, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(input_cart_lines) as item(sku text, quantity integer) group by item.sku order by item.sku
  loop
    if requested.quantity not between 1 and 99 then raise exception 'invalid_cart_line'; end if;
    select * into product_record from public.products where sku = requested.sku;
    if not found or product_record.status <> 'active' or product_record.archived_at is not null
      or product_record.published_at is null or product_record.published_at > now()
      or product_record.sales_mode <> 'buy_now' or product_record.price_cents is null
      or product_record.price_cents <= 0 or product_record.stock_status <> 'in_stock'
      or product_record.stock_quantity < requested.quantity then raise exception 'product_unavailable:%', requested.sku; end if;
    subtotal := subtotal + product_record.price_cents::bigint * requested.quantity;
  end loop;
  if subtotal > 100000000 or subtotal + shipping_record.price_cents > 100000000 then raise exception 'cart_total_limit'; end if;
  if (shipping_record.min_order_cents is not null and subtotal < shipping_record.min_order_cents)
    or (shipping_record.max_order_cents is not null and subtotal > shipping_record.max_order_cents) then raise exception 'shipping_rate_unavailable'; end if;
  if normalized_code is not null then
    if normalized_code !~ '^[A-Z0-9_-]{3,40}$' then raise exception 'discount_unavailable'; end if;
    select * into code_record from public.discount_codes where code = normalized_code;
    if not found then raise exception 'discount_unavailable'; end if;
    if input_lock then
      select * into campaign from public.discounts where id = code_record.discount_id for update;
      select * into code_record from public.discount_codes where code = normalized_code for update;
    else
      select * into campaign from public.discounts where id = code_record.discount_id;
    end if;
    if code_record.id is null or campaign.id is null or not code_record.active or not campaign.active
      or campaign.archived_at is not null or campaign.currency <> 'EUR' or campaign.rules <> '{}'::jsonb
      or campaign.discount_type not in ('fixed', 'percentage')
      or campaign.value <= 0 or (campaign.discount_type = 'percentage' and campaign.value > 100)
      or (campaign.starts_at is not null and campaign.starts_at > now())
      or (campaign.ends_at is not null and campaign.ends_at <= now())
      or (campaign.usage_limit is not null and campaign.used_count >= campaign.usage_limit)
      or (code_record.usage_limit is not null and code_record.used_count >= code_record.usage_limit)
      or (campaign.minimum_order_cents is not null and subtotal < campaign.minimum_order_cents) then raise exception 'discount_unavailable'; end if;
    reduction := least(subtotal, case when campaign.discount_type = 'fixed' then campaign.value
      else round(subtotal::numeric * campaign.value / 100)::integer end)::integer;
  end if;
  return jsonb_build_object('subtotalCents', subtotal, 'shippingCents', shipping_record.price_cents,
    'discountCents', reduction, 'totalCents', subtotal - reduction + shipping_record.price_cents,
    'code', normalized_code, 'discountId', campaign.id, 'codeId', code_record.id,
    'discountType', campaign.discount_type, 'discountValue', campaign.value);
end;
$$;
revoke all on function public.calculate_guest_checkout_quote(jsonb, uuid, text, boolean) from public, anon, authenticated, service_role;

create function public.quote_guest_checkout(input_cart_lines jsonb, input_shipping_rate_id uuid, input_discount_code text default null)
returns jsonb language sql security definer set search_path = '' as $$
  select public.calculate_guest_checkout_quote(input_cart_lines, input_shipping_rate_id, input_discount_code, false)
    - array['discountId', 'codeId', 'discountType', 'discountValue'];
$$;
revoke all on function public.quote_guest_checkout(jsonb, uuid, text) from public, anon, authenticated;
grant execute on function public.quote_guest_checkout(jsonb, uuid, text) to service_role;

-- Preserve the inventory reservation implementation as an owner-only helper.
alter function public.create_pending_guest_order(jsonb, text, text, jsonb, jsonb, uuid, text, text, uuid)
  rename to create_pending_guest_order_without_promotion;
revoke all on function public.create_pending_guest_order_without_promotion(jsonb, text, text, jsonb, jsonb, uuid, text, text, uuid) from public, anon, authenticated, service_role;

create function public.create_pending_guest_order(
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
  -- Cumulative rounding allocates every cent exactly once and respects each line.
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
  update public.orders set discount_cents = discount, total_cents = (quote->>'totalCents')::integer, tax_cents = tax_total,
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
revoke all on function public.create_pending_guest_order(jsonb, text, text, jsonb, jsonb, uuid, text, text, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.create_pending_guest_order(jsonb, text, text, jsonb, jsonb, uuid, text, text, uuid, text, integer) to service_role;

create function public.release_cancelled_order_discount()
returns trigger language plpgsql security definer set search_path = '' as $$
declare campaign_id uuid;
begin
  if new.status = 'cancelled' and old.status in ('pending', 'awaiting_payment')
    and old.discount_code_id is not null and old.discount_released_at is null
    and not exists(select 1 from public.payments where order_id = old.id and status in ('authorized', 'paid', 'partially_refunded', 'refunded')) then
    select discount_id into campaign_id from public.discount_codes where id = old.discount_code_id;
    perform id from public.discounts where id = campaign_id for update;
    perform id from public.discount_codes where id = old.discount_code_id for update;
    update public.discounts set used_count = greatest(0, used_count - 1) where id = campaign_id;
    update public.discount_codes set used_count = greatest(0, used_count - 1) where id = old.discount_code_id;
    new.discount_released_at := now();
  end if;
  return new;
end;
$$;
revoke all on function public.release_cancelled_order_discount() from public, anon, authenticated, service_role;
create trigger orders_release_cancelled_discount before update of status on public.orders
for each row execute function public.release_cancelled_order_discount();

commit;
