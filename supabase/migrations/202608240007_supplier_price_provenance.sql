-- Traceable public source prices for draft product research.
-- These fields do not set Bistrava's selling price or public availability.

alter table public.products
  add column supplier_price_max_cents integer,
  add column supplier_price_includes_vat boolean,
  add column supplier_price_source_name text,
  add column supplier_price_source_url text,
  add column supplier_price_observed_at date,
  add column supplier_price_note_sl text;

alter table public.products
  add constraint products_supplier_price_range_valid check (
    supplier_price_max_cents is null
    or (
      supplier_price_cents is not null
      and supplier_price_max_cents >= supplier_price_cents
    )
  ),
  add constraint products_supplier_price_source_url_valid check (
    supplier_price_source_url is null
    or supplier_price_source_url ~ '^https://'
  ),
  add constraint products_supplier_price_provenance_complete check (
    supplier_price_cents is null
    or (
      supplier_price_source_name is not null
      and supplier_price_source_url is not null
      and supplier_price_observed_at is not null
      and supplier_price_note_sl is not null
    )
  );
