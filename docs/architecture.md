# Architecture

## Scope

This phase establishes the specialist Bistrava experience without enabling unverified commerce. The 86 imported source references are preserved locally; 24 enriched specialist candidates are exposed as `draft` cards and 62 are `archived`. Supabase is the activation source of truth: only a matching `active` database row can enter the public offer, sitemap, or Merchant feed.

## Application boundaries

- `src/app/(store)`: public storefront routes wrapped by the shared header and footer.
- `src/app/admin`: server-protected administration shell; never relies on a hidden navigation link for security.
- `src/actions`: mutations initiated by the interface. Each action must authenticate and validate again on the server.
- `src/components`: small presentational components, Server Components by default.
- `src/lib/supabase`: separate browser, cookie-based server, proxy, and secret-key clients.
- `src/lib/auth`: server-side authorization based on verified Supabase claims plus an active database role.
- `src/lib/email`: server-only Resend delivery layer.
- `src/lib/payments`: provider-neutral contract only; no payment provider is connected.
- `src/lib/catalog`: preserved source data, enrichment, activation rules, and deterministic SQL export.
- `src/lib/configurator`: deterministic profile selection that refuses to guess when key inputs are missing.
- `src/lib/analytics`: Consent Mode v2 defaults, optional GTM/GA4/Ads loading, and non-PII events.
- `supabase/migrations`: database schema, RLS, functions, and storage policies.

## Request and data flow

Public active-catalog reads use Server Components and Supabase RLS. Local enriched records supply reviewed editorial content, while database rows control activation, price, public stock status, and publication timestamps. Inquiry mutations use a validated Server Action, store consent and attribution in `quote_requests`, and trigger optional Resend notifications. Webhooks use Route Handlers because external signatures require the raw request.

The root `proxy.ts` only refreshes Supabase cookie sessions. Authorization still runs in the protected page or Server Action with `auth.getClaims()` and a role query. This avoids trusting an unverified cookie session.

## Caching

Authenticated routes are dynamic. Supabase SSR applies private/no-store response headers when an auth token is refreshed. Public catalog caching will be introduced only after database reads replace demo data, with explicit invalidation tags for products, categories, and guides.

## Catalog, money, and inventory

All monetary values are integer cents in EUR. Order items store immutable product, name, SKU, variant, price, and tax snapshots. Inventory is changed through `adjust_inventory`, which locks the variant row, prevents a negative balance, updates stock, and writes an immutable movement in one transaction.

The specialist drafts use an internal owner-provided stock quantity of 5 with `stock_status = 'unverified'`. That number is never shown as public availability. `price_cents` remains `null` until Bistrava approves a selling price. All 24 records now have an exact supplier-page match; `supplier_price_*` stores a dated, VAT-aware public retail observation and its source and is explicitly not treated as a negotiated acquisition cost. Each draft also has four local gallery assets: available supplier images plus clearly labelled Bistrava information panels when the source publishes fewer than four distinct photographs.

## External services

Supabase, Resend, Vercel, domain, payment, analytics, and consent services are not provisioned by this repository. Connections are documented and must be explicitly authorized before production changes or paid resources are created.
