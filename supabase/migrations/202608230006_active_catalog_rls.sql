begin;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
for select to anon, authenticated
using (
  status in ('published', 'active')
  and archived_at is null
  and published_at is not null
  and published_at <= now()
);

drop policy if exists "variants_public_read" on public.product_variants;
create policy "variants_public_read" on public.product_variants
for select to anon, authenticated using (
  status in ('published', 'active')
  and archived_at is null
  and exists (
    select 1 from public.products p
    where p.id = product_id
      and p.status in ('published', 'active')
      and p.archived_at is null
      and p.published_at <= now()
  )
);

drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images
for select to anon, authenticated using (exists (
  select 1 from public.products p
  where p.id = product_id
    and p.status in ('published', 'active')
    and p.archived_at is null
    and p.published_at <= now()
));

drop policy if exists "product_documents_public_read" on public.product_documents;
create policy "product_documents_public_read" on public.product_documents
for select to anon, authenticated using (exists (
  select 1 from public.products p
  where p.id = product_id
    and p.status in ('published', 'active')
    and p.archived_at is null
    and p.published_at <= now()
));

drop policy if exists "product_categories_public_read" on public.product_categories;
create policy "product_categories_public_read" on public.product_categories
for select to anon, authenticated using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and p.status in ('published', 'active')
      and p.archived_at is null
      and p.published_at <= now()
  )
  and exists (
    select 1 from public.categories c
    where c.id = category_id
      and c.status in ('published', 'active')
      and c.archived_at is null
      and c.published_at <= now()
  )
);

commit;
