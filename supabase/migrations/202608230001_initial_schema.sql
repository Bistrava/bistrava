begin;

create extension if not exists pgcrypto;

create type public.admin_role as enum ('admin', 'editor');
create type public.catalog_status as enum ('draft', 'published', 'archived');
create type public.cart_status as enum ('active', 'converted', 'abandoned', 'expired');
create type public.order_status as enum (
  'pending', 'awaiting_payment', 'paid', 'processing', 'shipped',
  'completed', 'cancelled', 'refunded', 'partially_refunded'
);
create type public.payment_status as enum (
  'pending', 'requires_action', 'authorized', 'paid', 'failed',
  'cancelled', 'refunded', 'partially_refunded'
);
create type public.shipment_status as enum (
  'pending', 'ready', 'shipped', 'in_transit', 'delivered', 'returned', 'cancelled'
);
create type public.inventory_reason as enum (
  'initial', 'purchase', 'sale', 'return', 'correction', 'damage', 'reservation', 'release'
);
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.email_status as enum (
  'queued', 'sent', 'delivered', 'bounced', 'complained', 'suppressed', 'failed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  locale text not null default 'sl-SI',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_roles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  role public.admin_role not null,
  active boolean not null default true,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  first_name text not null,
  last_name text not null,
  company text,
  address_line_1 text not null,
  address_line_2 text,
  postal_code text not null,
  city text not null,
  country_code char(2) not null default 'SI',
  phone text,
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  status public.catalog_status not null default 'draft',
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand text not null,
  short_description text not null,
  description text,
  status public.catalog_status not null default 'draft',
  benefits jsonb not null default '[]'::jsonb,
  water_problems jsonb not null default '[]'::jsonb,
  applications jsonb not null default '[]'::jsonb,
  technical_specs jsonb not null default '{}'::jsonb,
  capacity text,
  flow_rate text,
  dimensions text,
  weight text,
  operating_pressure text,
  connections text,
  filter_life text,
  recommended_household_size text,
  installation text,
  maintenance text,
  warranty text,
  delivery_estimate text,
  seo_title text,
  seo_description text,
  merchant_data jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  name text not null,
  sku text not null unique,
  gtin text unique,
  mpn text,
  price_cents integer not null,
  compare_at_price_cents integer,
  currency char(3) not null default 'EUR',
  stock_quantity integer not null default 0,
  track_inventory boolean not null default true,
  allow_backorder boolean not null default false,
  attributes jsonb not null default '{}'::jsonb,
  weight_grams integer,
  status public.catalog_status not null default 'draft',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_price_nonnegative check (price_cents >= 0),
  constraint product_variants_compare_price_valid check (
    compare_at_price_cents is null or compare_at_price_cents > price_cents
  ),
  constraint product_variants_stock_nonnegative check (stock_quantity >= 0),
  constraint product_variants_currency_eur check (currency = 'EUR'),
  constraint product_variants_gtin_format check (gtin is null or gtin ~ '^\d{8,14}$')
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null,
  width integer,
  height integer,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);

create table public.product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  document_type text not null,
  storage_path text not null,
  language_code text not null default 'sl',
  file_size_bytes integer,
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  reason public.inventory_reason not null,
  quantity_delta integer not null,
  balance_after integer not null,
  reference_type text,
  reference_id uuid,
  note text,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_delta_nonzero check (quantity_delta <> 0),
  constraint inventory_balance_nonnegative check (balance_after >= 0)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  guest_token_hash text unique,
  status public.cart_status not null default 'active',
  currency char(3) not null default 'EUR',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_present check (profile_id is not null or guest_token_hash is not null),
  constraint carts_currency_eur check (currency = 'EUR')
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null,
  unit_price_cents integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id),
  constraint cart_items_quantity_positive check (quantity > 0 and quantity <= 99),
  constraint cart_items_price_nonnegative check (unit_price_cents >= 0)
);

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_codes text[] not null default array['SI']::text[],
  postal_code_patterns text[] not null default '{}'::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.shipping_zones(id) on delete cascade,
  name text not null,
  price_cents integer not null,
  currency char(3) not null default 'EUR',
  min_order_cents integer,
  max_order_cents integer,
  estimated_days_min integer,
  estimated_days_max integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_rates_price_nonnegative check (price_cents >= 0),
  constraint shipping_rates_currency_eur check (currency = 'EUR')
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  profile_id uuid references public.profiles(id) on delete set null,
  cart_id uuid references public.carts(id) on delete set null,
  status public.order_status not null default 'pending',
  email text not null,
  phone text,
  currency char(3) not null default 'EUR',
  subtotal_cents integer not null,
  discount_cents integer not null default 0,
  shipping_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null,
  billing_address_snapshot jsonb not null,
  shipping_address_snapshot jsonb not null,
  customer_note text,
  internal_note text,
  placed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_amounts_nonnegative check (
    subtotal_cents >= 0 and discount_cents >= 0 and shipping_cents >= 0
    and tax_cents >= 0 and total_cents >= 0
  ),
  constraint orders_total_consistent check (
    total_cents = subtotal_cents - discount_cents + shipping_cents + tax_cents
  ),
  constraint orders_currency_eur check (currency = 'EUR')
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text not null,
  sku text not null,
  product_snapshot jsonb not null,
  quantity integer not null,
  unit_price_cents integer not null,
  tax_cents integer not null default 0,
  line_total_cents integer not null,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_amounts_nonnegative check (
    unit_price_cents >= 0 and tax_cents >= 0 and line_total_cents >= 0
  )
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null,
  provider_reference text,
  status public.payment_status not null default 'pending',
  amount_cents integer not null,
  currency char(3) not null default 'EUR',
  idempotency_key text not null unique,
  authorized_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  refunded_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_nonnegative check (amount_cents >= 0 and refunded_cents >= 0),
  constraint payments_refund_limit check (refunded_cents <= amount_cents),
  constraint payments_currency_eur check (currency = 'EUR')
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  verified boolean not null default false,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  status public.shipment_status not null default 'pending',
  carrier text,
  service text,
  tracking_number text,
  tracking_url text,
  shipping_address_snapshot jsonb not null,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  discount_type text not null check (discount_type in ('fixed', 'percentage', 'shipping')),
  value integer not null,
  currency char(3) not null default 'EUR',
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  minimum_order_cents integer,
  active boolean not null default false,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint discounts_value_positive check (value > 0),
  constraint discounts_usage_valid check (usage_limit is null or usage_limit >= used_count)
);

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references public.discounts(id) on delete cascade,
  code text not null unique,
  active boolean not null default true,
  usage_limit integer,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_codes_uppercase check (code = upper(code)),
  constraint discount_codes_usage_valid check (usage_limit is null or usage_limit >= used_count)
);

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content jsonb not null default '{}'::jsonb,
  status public.catalog_status not null default 'draft',
  seo_title text,
  seo_description text,
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guides_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  profile_id uuid references public.profiles(id) on delete set null,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating smallint not null,
  title text,
  body text not null,
  reviewer_name text not null,
  status public.review_status not null default 'pending',
  verified_purchase boolean not null default false,
  moderated_by uuid references public.profiles(id) on delete set null,
  moderated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_range check (rating between 1 and 5)
);

create table public.seo_redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique,
  destination_path text not null,
  status_code integer not null default 308,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seo_redirects_paths check (
    source_path like '/%' and destination_path like '/%' and source_path <> destination_path
  ),
  constraint seo_redirects_status check (status_code in (301, 308))
);

create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  provider_message_id text,
  provider_event_id text unique,
  email_type text not null,
  recipient_hash text not null,
  idempotency_key text not null unique,
  status public.email_status not null default 'queued',
  related_order_id uuid references public.orders(id) on delete set null,
  error_code text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index addresses_profile_id_idx on public.addresses(profile_id);
create index products_status_idx on public.products(status, published_at);
create index categories_status_idx on public.categories(status, sort_order);
create index product_variants_product_id_idx on public.product_variants(product_id);
create index product_categories_category_id_idx on public.product_categories(category_id);
create index inventory_movements_variant_created_idx on public.inventory_movements(variant_id, created_at desc);
create index carts_profile_status_idx on public.carts(profile_id, status);
create index orders_profile_created_idx on public.orders(profile_id, created_at desc);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index payments_order_id_idx on public.payments(order_id);
create index payment_events_payment_id_idx on public.payment_events(payment_id);
create index shipments_order_id_idx on public.shipments(order_id);
create index reviews_product_status_idx on public.reviews(product_id, status, published_at);
create index guides_status_published_idx on public.guides(status, published_at);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.has_admin_role(required_roles public.admin_role[] default array['admin', 'editor']::public.admin_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_roles
    where profile_id = auth.uid()
      and active = true
      and role = any(required_roles)
  );
$$;

create function public.adjust_inventory(
  target_variant_id uuid,
  delta integer,
  movement_reason public.inventory_reason,
  movement_note text default null,
  source_type text default null,
  source_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_quantity integer;
  next_quantity integer;
begin
  if not public.has_admin_role(array['admin', 'editor']::public.admin_role[]) then
    raise exception 'insufficient_privilege';
  end if;
  if delta = 0 then
    raise exception 'inventory_delta_must_not_be_zero';
  end if;

  select stock_quantity into current_quantity
  from public.product_variants
  where id = target_variant_id
  for update;

  if current_quantity is null then
    raise exception 'variant_not_found';
  end if;

  next_quantity := current_quantity + delta;
  if next_quantity < 0 then
    raise exception 'insufficient_inventory';
  end if;

  update public.product_variants
  set stock_quantity = next_quantity, updated_at = now()
  where id = target_variant_id;

  insert into public.inventory_movements (
    variant_id, reason, quantity_delta, balance_after,
    reference_type, reference_id, note, actor_id
  ) values (
    target_variant_id, movement_reason, delta, next_quantity,
    source_type, source_id, movement_note, auth.uid()
  );

  return next_quantity;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'admin_roles', 'addresses', 'categories', 'products',
    'product_variants', 'carts', 'cart_items', 'shipping_zones',
    'shipping_rates', 'orders', 'payments', 'shipments', 'discounts',
    'discount_codes', 'guides', 'reviews', 'seo_redirects'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

revoke all on function public.has_admin_role(public.admin_role[]) from public;
revoke all on function public.adjust_inventory(uuid, integer, public.inventory_reason, text, text, uuid) from public;
grant execute on function public.has_admin_role(public.admin_role[]) to authenticated;
grant execute on function public.adjust_inventory(uuid, integer, public.inventory_reason, text, text, uuid) to authenticated, service_role;

commit;
