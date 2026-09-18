begin;

create type public.sales_mode as enum ('buy_now', 'quote', 'installation_required');
create type public.stock_status as enum ('in_stock', 'out_of_stock', 'backorder', 'unverified');
create type public.quote_request_type as enum (
  'contact', 'quote', 'installation', 'service', 'advice', 'configurator'
);
create type public.quote_request_status as enum ('new', 'in_review', 'responded', 'closed');
create type public.product_relation_type as enum ('accessory', 'consumable');

alter table public.products
  add column sku text unique,
  add column technology text,
  add column name_sl text,
  add column short_description_sl text,
  add column description_sl text,
  add column price_cents integer,
  add column supplier_price_cents integer,
  add column compare_at_price_cents integer,
  add column vat_rate numeric(5, 2) not null default 22.00,
  add column currency char(3) not null default 'EUR',
  add column sales_mode public.sales_mode not null default 'quote',
  add column stock_status public.stock_status not null default 'unverified',
  add column stock_quantity integer not null default 5,
  add column lead_time_days integer,
  add column household_size_min integer,
  add column household_size_max integer,
  add column resin_volume_liters numeric(10, 2),
  add column nominal_flow_lpm numeric(10, 2),
  add column max_flow_lpm numeric(10, 2),
  add column connection_size text,
  add column regeneration_mode text,
  add column salt_consumption_kg numeric(10, 2),
  add column weight_kg numeric(10, 2),
  add column drain_required boolean,
  add column electricity_required boolean,
  add column bypass_included boolean,
  add column installation_required boolean not null default false,
  add column warranty_months integer,
  add column certifications jsonb not null default '[]'::jsonb,
  add column featured boolean not null default false,
  add column canonical_url text;

alter table public.products
  add constraint products_price_nonnegative check (price_cents is null or price_cents >= 0),
  add constraint products_supplier_price_nonnegative check (
    supplier_price_cents is null or supplier_price_cents >= 0
  ),
  add constraint products_compare_price_valid check (
    compare_at_price_cents is null
    or (price_cents is not null and compare_at_price_cents > price_cents)
  ),
  add constraint products_vat_rate_valid check (vat_rate between 0 and 100),
  add constraint products_currency_eur check (currency = 'EUR'),
  add constraint products_stock_quantity_nonnegative check (stock_quantity >= 0),
  add constraint products_lead_time_nonnegative check (lead_time_days is null or lead_time_days >= 0),
  add constraint products_household_range_valid check (
    household_size_min is null
    or household_size_max is null
    or household_size_max >= household_size_min
  ),
  add constraint products_warranty_nonnegative check (warranty_months is null or warranty_months >= 0),
  add constraint products_canonical_url_valid check (
    canonical_url is null or canonical_url like 'https://bistrava.com/%'
  );

create table public.product_relations (
  product_id uuid not null references public.products(id) on delete cascade,
  related_product_id uuid not null references public.products(id) on delete restrict,
  relation_type public.product_relation_type not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, related_product_id, relation_type),
  constraint product_relations_not_self check (product_id <> related_product_id)
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  request_type public.quote_request_type not null,
  status public.quote_request_status not null default 'new',
  name text not null,
  email text not null,
  phone text,
  municipality text,
  postal_code text,
  message text not null,
  product_slug text,
  result_payload jsonb not null default '{}'::jsonb,
  attribution jsonb not null default '{}'::jsonb,
  consent_version text not null,
  consented_at timestamptz not null,
  ip_hash text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  internal_note text,
  responded_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_requests_name_length check (char_length(name) between 2 and 120),
  constraint quote_requests_message_length check (char_length(message) between 10 and 4000),
  constraint quote_requests_email_length check (char_length(email) <= 254),
  constraint quote_requests_ip_hash_length check (char_length(ip_hash) = 64)
);

create index products_specialist_status_idx
  on public.products(status, featured, sales_mode, stock_status);
create index product_relations_related_idx
  on public.product_relations(related_product_id, relation_type);
create index quote_requests_status_created_idx
  on public.quote_requests(status, created_at desc);
create index quote_requests_product_slug_idx
  on public.quote_requests(product_slug)
  where product_slug is not null;

create trigger quote_requests_set_updated_at
before update on public.quote_requests
for each row execute function public.set_updated_at();

alter table public.product_relations enable row level security;
alter table public.quote_requests enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
for select to anon, authenticated
using (
  status in ('published', 'active')
  and archived_at is null
  and published_at is not null
  and published_at <= now()
);

create policy "product_relations_public_read" on public.product_relations
for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and p.status in ('published', 'active')
      and p.archived_at is null
      and p.published_at <= now()
  )
  and exists (
    select 1 from public.products rp
    where rp.id = related_product_id
      and rp.status in ('published', 'active')
      and rp.archived_at is null
      and rp.published_at <= now()
  )
);

create policy "product_relations_staff_all" on public.product_relations
for all to authenticated
using (public.has_admin_role())
with check (public.has_admin_role());

-- Anonymous browsers have no policy on quote_requests. Public submissions are
-- validated by the server action and inserted with the server-only Supabase key.
create policy "quote_requests_staff_all" on public.quote_requests
for all to authenticated
using (public.has_admin_role())
with check (public.has_admin_role());

commit;
