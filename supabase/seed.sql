-- Development-only seed. Nothing in this file is a public sales offer.
-- All catalog rows stay in draft and are therefore hidden by public RLS policies.

insert into public.categories (
  id, name, slug, description, status, sort_order
) values (
  '10000000-0000-4000-8000-000000000001',
  'Predstavitvena kategorija',
  'predstavitvena-kategorija',
  'Razvojni zapis za preverjanje administracije in podatkovnega modela.',
  'draft',
  999
) on conflict (slug) do nothing;

insert into public.products (
  id, name, slug, brand, short_description, description, status
) values (
  '20000000-0000-4000-8000-000000000001',
  'Predstavitveni izdelek – ni v prodaji',
  'predstavitveni-izdelek-ni-v-prodaji',
  'Bistrava Demo',
  'Razvojni zapis za preverjanje strukture produktnih podatkov.',
  'Vrednosti so predstavitvene in morajo biti zamenjane pred objavo.',
  'draft'
) on conflict (slug) do nothing;

insert into public.product_variants (
  id, product_id, name, sku, price_cents, stock_quantity, track_inventory, status
) values (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'Predstavitvena različica',
  'DEMO-NOT-FOR-SALE',
  0,
  0,
  true,
  'draft'
) on conflict (sku) do nothing;

insert into public.product_categories (product_id, category_id)
values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001'
) on conflict do nothing;
