-- The storefront prices include VAT. tax_cents is the VAT share used for
-- reporting and must not be added to the customer-facing total a second time.

alter table public.orders
  drop constraint if exists orders_total_consistent;

alter table public.orders
  add constraint orders_total_consistent check (
    total_cents = subtotal_cents - discount_cents + shipping_cents
  );

create index if not exists orders_email_created_idx
  on public.orders ((lower(email)), created_at desc);

create index if not exists profiles_email_idx
  on public.profiles ((lower(email)))
  where email is not null;
