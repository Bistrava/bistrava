begin;

-- Remove catalog rows that cannot be presented: no product image and no
-- Bistrava or verified supplier price. Dependent category links cascade.
delete from public.products as product
where product.price_cents is null
  and product.supplier_price_cents is null
  and not exists (
    select 1
    from public.product_images as image
    where image.product_id = product.id
  );

commit;
