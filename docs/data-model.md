# Data model

## Catalog

- `categories`: hierarchical Slovenian catalog taxonomy with unique slugs and draft/published/archived lifecycle.
- `products`: lifecycle, supplier/retail pricing, sales mode, public stock state, internal quantity, household/flow/connection/regeneration data, dimensions, warranty, certifications, SEO, and Merchant-ready fields.
- `product_variants`: unique SKU, optional verified GTIN/MPN, EUR prices in cents, and tracked stock.
- `product_images`, `product_documents`: ordered media and documentation references in Supabase Storage.
- `product_inventory_movements`: product-level stock reservations for the active specialist catalog; order snapshots remain immutable.
- `product_categories`: many-to-many catalog assignment.
- `product_relations`: accessories, consumables, alternatives, and related-product links without duplicating product data.

## Leads and consent

- `quote_requests`: contact, quote, installation, service, advice, and configurator submissions with structured result payload, UTM attribution, consent version/time, and a salted IP hash.
- Anonymous roles cannot read or write inquiry rows directly. The validated server action uses the server-only Supabase secret client.

## Identity and administration

- `profiles`: application profile keyed to `auth.users`.
- `admin_roles`: manually assigned `admin` or `editor` role; no public administrator registration.
- `addresses`: reusable customer addresses for a future customer account phase.
- `audit_logs`: append-oriented administrative action trail with actor, entity, request, and before/after data.

## Cart, order, and fulfillment

- `carts`, `cart_items`: authenticated or hashed guest carts. Guest access will be implemented through a server-side token flow rather than public table writes.
- `orders`: explicit lifecycle states, immutable address snapshots, cent-based totals, checkout idempotency, shipping-rate reference, and hashed guest-access token.
- `order_items`: immutable purchase snapshots; later product edits cannot change an old order.
- `payments`, `payment_events`: provider-neutral payment records and idempotent raw provider events.
- `shipments`: carrier, tracking, status, and immutable delivery address snapshot.
- `shipping_zones`, `shipping_rates`: Slovenia-first delivery configuration.

## Promotion, content, and operations

- `discounts`, `discount_codes`: inactive by default, with explicit limits and rules.
- `guides`: draft/published/archived educational content.
- `reviews`: moderation required; public RLS only exposes approved reviews.
- `seo_redirects`: permanent redirect registry for future application routing.
- `email_events`: hashed-recipient delivery ledger and idempotency keys.

## Integrity rules

- All prices are non-negative integer cents; currency is currently constrained to EUR.
- Slugs and SKUs are unique. GTIN is optional and validated only when present.
- Inventory balances cannot become negative.
- Commercial records use restrictive foreign keys and are not destructively cascaded from catalog edits.
- Active catalog and published guide rows are the only anonymous-readable content.
- Sensitive writes require authenticated staff RLS or a server-side secret client.
