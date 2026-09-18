begin;

alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_documents enable row level security;
alter table public.product_categories enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.shipments enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.discounts enable row level security;
alter table public.discount_codes enable row level security;
alter table public.guides enable row level security;
alter table public.reviews enable row level security;
alter table public.seo_redirects enable row level security;
alter table public.email_events enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_read_own" on public.profiles
for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_staff_all" on public.profiles
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "admin_roles_read_own" on public.admin_roles
for select to authenticated using (profile_id = auth.uid());
create policy "admin_roles_admin_all" on public.admin_roles
for all to authenticated
using (public.has_admin_role(array['admin']::public.admin_role[]))
with check (public.has_admin_role(array['admin']::public.admin_role[]));

create policy "addresses_owner_all" on public.addresses
for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "addresses_staff_all" on public.addresses
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "categories_public_read" on public.categories
for select to anon, authenticated
using (status = 'published' and archived_at is null and published_at <= now());
create policy "categories_staff_all" on public.categories
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "products_public_read" on public.products
for select to anon, authenticated
using (status = 'published' and archived_at is null and published_at <= now());
create policy "products_staff_all" on public.products
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "variants_public_read" on public.product_variants
for select to anon, authenticated using (
  status = 'published' and archived_at is null and exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'published' and p.archived_at is null and p.published_at <= now()
  )
);
create policy "variants_staff_all" on public.product_variants
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "product_images_public_read" on public.product_images
for select to anon, authenticated using (exists (
  select 1 from public.products p
  where p.id = product_id and p.status = 'published' and p.archived_at is null and p.published_at <= now()
));
create policy "product_images_staff_all" on public.product_images
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "product_documents_public_read" on public.product_documents
for select to anon, authenticated using (exists (
  select 1 from public.products p
  where p.id = product_id and p.status = 'published' and p.archived_at is null and p.published_at <= now()
));
create policy "product_documents_staff_all" on public.product_documents
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "product_categories_public_read" on public.product_categories
for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'published' and p.archived_at is null)
  and exists (select 1 from public.categories c where c.id = category_id and c.status = 'published' and c.archived_at is null)
);
create policy "product_categories_staff_all" on public.product_categories
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "inventory_staff_read" on public.inventory_movements
for select to authenticated using (public.has_admin_role());
create policy "inventory_staff_insert" on public.inventory_movements
for insert to authenticated with check (public.has_admin_role());

create policy "carts_owner_all" on public.carts
for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "carts_staff_all" on public.carts
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "cart_items_owner_all" on public.cart_items
for all to authenticated using (exists (
  select 1 from public.carts c where c.id = cart_id and c.profile_id = auth.uid()
)) with check (exists (
  select 1 from public.carts c where c.id = cart_id and c.profile_id = auth.uid()
));
create policy "cart_items_staff_all" on public.cart_items
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "orders_owner_read" on public.orders
for select to authenticated using (profile_id = auth.uid());
create policy "orders_staff_all" on public.orders
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "order_items_owner_read" on public.order_items
for select to authenticated using (exists (
  select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()
));
create policy "order_items_staff_all" on public.order_items
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "payments_owner_read" on public.payments
for select to authenticated using (exists (
  select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()
));
create policy "payments_staff_all" on public.payments
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "payment_events_staff_all" on public.payment_events
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "shipments_owner_read" on public.shipments
for select to authenticated using (exists (
  select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()
));
create policy "shipments_staff_all" on public.shipments
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "shipping_zones_public_read" on public.shipping_zones
for select to anon, authenticated using (active = true);
create policy "shipping_zones_staff_all" on public.shipping_zones
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());
create policy "shipping_rates_public_read" on public.shipping_rates
for select to anon, authenticated using (
  active = true and exists (select 1 from public.shipping_zones z where z.id = zone_id and z.active = true)
);
create policy "shipping_rates_staff_all" on public.shipping_rates
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "discounts_staff_all" on public.discounts
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());
create policy "discount_codes_staff_all" on public.discount_codes
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "guides_public_read" on public.guides
for select to anon, authenticated
using (status = 'published' and archived_at is null and published_at <= now());
create policy "guides_staff_all" on public.guides
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "reviews_public_read" on public.reviews
for select to anon, authenticated
using (status = 'approved' and published_at is not null and published_at <= now());
create policy "reviews_owner_read" on public.reviews
for select to authenticated using (profile_id = auth.uid());
create policy "reviews_authenticated_insert" on public.reviews
for insert to authenticated with check (profile_id = auth.uid() and status = 'pending');
create policy "reviews_staff_all" on public.reviews
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());

create policy "seo_redirects_staff_all" on public.seo_redirects
for all to authenticated using (public.has_admin_role()) with check (public.has_admin_role());
create policy "email_events_staff_read" on public.email_events
for select to authenticated using (public.has_admin_role());
create policy "email_events_staff_insert" on public.email_events
for insert to authenticated with check (public.has_admin_role());
create policy "audit_logs_staff_read" on public.audit_logs
for select to authenticated using (public.has_admin_role());
create policy "audit_logs_staff_insert" on public.audit_logs
for insert to authenticated with check (public.has_admin_role());

commit;
