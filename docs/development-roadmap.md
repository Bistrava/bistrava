# Development roadmap

## Phase 1 — foundation (current)

- Brand-aligned responsive specialist storefront and complete public route structure.
- 24 enriched catalog drafts, 62 archived source references, and a strict activation gate.
- Supabase SSR clients, session proxy, admin login, role checks, migrations, RLS, and storage policies.
- Validated quote/configurator/service forms, Supabase persistence, Resend templates, spam trap, and rate limiting.
- SEO metadata, sitemap, robots, Merchant feed, visible/schema-aligned FAQ, Article data, and canonical redirects.
- Consent Mode v2, inquiry/configurator events, unit tests, E2E tests, and multi-viewport visual checks.

## Phase 2 — verified catalog and admin content

- Connect approved Supabase Development and Preview projects.
- Generate database types from the linked schema.
- Build authenticated product, category, media, inventory, guide, and redirect administration.
- Verify supplier prices, retail prices, VAT, specifications, certificates, warranty, availability, and approved media for each selected SKU.
- Activate only complete products; keep all other rows draft or archived.
- Add cache tags and safe revalidation after staff mutations.

## Phase 3 — cart, checkout, and operations (in progress)

- Confirm legal entity, VAT rules, terms, privacy/cookie text, returns, delivery zones, and fulfillment process.
- Select a payment provider with explicit approval, then implement signed webhook verification and reconciliation.
- Implemented: persistent browser cart, quantities, totals, commerce analytics events, validated checkout, server-recalculated totals, transactional pending-order creation, stock reservation, idempotency, and protected guest-order access.
- Remaining: inventory reservation expiry/release operations, approved delivery-rate data, payment-provider integration, webhook reconciliation, cancellation/refund/shipping email templates, and customer accounts if required.

## Phase 4 — consent, measurement, and launch

- Validate the implemented Consent Mode v2 behavior and GTM/GA4/Google Ads IDs in Preview.
- Complete commerce event emission only when cart and checkout are enabled.
- Run accessibility, performance, security, SEO, structured-data, and end-to-end purchase audits.
- Connect `bistrava.com`, `www.bistrava.com`, and verified mail DNS only after approval.
- Release through Vercel Preview, then request explicit production approval.
