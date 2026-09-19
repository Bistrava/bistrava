# Bistrava specialist repositioning — delivery notes

## Delivered scope

The local application now positions Bistrava as **“Bistrava – strokovnjak za mehko vodo brez vodnega kamna”**, with the supporting line **“Analiza, svetovanje, mehčalci vode, montaža in vzdrževanje.”** The design follows the supplied navy/teal palette, Manrope/Inter typography, calm technical voice, and non-alarmist treatment of hard water.

The main navigation is:

1. Mehčalci vode
2. Rešitve proti vodnemu kamnu
3. Izbira mehčalca
4. Montaža in servis
5. Vodniki
6. Kontakt

The homepage contains the requested ten-part conversion journey: specialist hero, scale problem, need-based routes, configurator introduction, active-offer gate, technology explanation, installation process, guides, visible FAQ, and quote CTA.

## Public route map

| Purpose | Route |
| --- | --- |
| Home | `/` |
| Specialist catalog | `/mehcalci-vode` |
| Technology | `/mehcalne-naprave` |
| Scale | `/vodni-kamen` |
| Hard water | `/trda-voda` |
| House solution | `/mehcalec-vode-za-hiso` |
| Apartment solution | `/mehcalec-vode-za-stanovanje` |
| Installation | `/montaza-mehcalca-vode` |
| Service | `/servis-mehcalnih-naprav` |
| Salt | `/sol-za-mehcalec-vode` |
| Hardness test | `/test-trdote-vode` |
| Configurator | `/izbira-mehcalca` |
| Products | `/izdelki/[slug]` |
| Guides | `/vodici` and `/vodici/[slug]` |
| FAQ | `/pogosta-vprasanja` |
| Company/contact | `/o-nas`, `/kontakt` |
| Legal | `/pravna-obvestila`, `/dostava`, `/placila`, `/vracila`, `/garancija`, `/zasebnost`, `/piskotki` |

Legacy URLs are redirected permanently where a direct equivalent exists. Draft products and guides are `noindex`; active products and published guides alone can enter the sitemap.

## Catalog state and activation gate

- The source workbook remains preserved for audit and re-import.
- 24 water-softening/scale specialist references have a Slovenian short description, long description, characteristic framework, SEO title/description, and canonical route.
- References without both an image and a verified price are excluded from the application and deleted from Supabase.
- The owner-provided default quantity of 5 is stored as an **internal** starting quantity only.
- All 24 candidates use `stock_status = 'unverified'`; the storefront never claims that five units are publicly available.
- All 24 retained products have a dated public source-price observation, VAT flag, source name/URL, and an explicit disclaimer. These observations are public retail prices, not negotiated acquisition costs or Bistrava selling prices.
- Bistrava retail price, compare-at price, exact technical values, certifications, documents, warranty, lead time, and product photography remain empty unless verified.
- A product can be indexed, shown in the active offer, or exported to Merchant Center only after an approved Supabase row is `active` and passes the relevant field checks.

Regenerate the reviewable SQL:

```powershell
pnpm catalog:seed:sql
```

The generated file is `supabase/seed-specialist-products.sql`. Database cleanup is handled by the catalog pruning migration.

## Supabase setup

Apply migrations in filename order to a development project first:

1. `202608230001_initial_schema.sql`
2. `202608230002_row_level_security.sql`
3. `202608230003_storage_policies.sql`
4. `202608230004_add_active_catalog_status.sql`
5. `202608230005_specialist_catalog_and_quote_requests.sql`
6. `202608230006_active_catalog_rls.sql`
7. `202608240007_supplier_price_provenance.sql`

Then review and apply `supabase/seed-specialist-products.sql`. Confirm anonymous users can read only active catalog rows and cannot read `quote_requests`; the server secret client alone writes inquiries. Generate fresh database TypeScript types after migration.

Before activating each product, supply and verify:

- exact supplier identity, negotiated acquisition price, approved Bistrava retail price, VAT treatment, and sales mode;
- public availability, lead time, SKU/GTIN/MPN where applicable;
- resin volume, flows, connection, regeneration, salt usage, dimensions, weight, operating constraints, and included accessories;
- official warranty, certificates, manuals, installation sheet, and approved imagery;
- compatibility statements and any claims shown in the long description.

## Inquiry and email setup

Forms cover general contact, quote, installation, service, advice, and configurator results. Client and server constraints share Zod rules. Each stored request includes consent version/time, UTM attribution, product/configurator payload, and an IP hash. The honeypot and per-instance rate limiter are a first protection layer; use a durable edge/store-backed limiter before high-volume campaigns.

Configure `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, and `EMAIL_INTERNAL_TO` only after verifying the sending domain. Copy current SPF, DKIM, return-path/MX, and DMARC values from Resend; do not invent DNS records. Submit one request in Preview and confirm database storage, acknowledgement, internal notification, bounce handling, and reply routing.

## SEO, measurement, and Merchant Center

- Metadata, canonical URLs, Open Graph, robots, sitemap, breadcrumbs, Organization/WebSite, visible FAQ/FAQPage, and draft Article data are implemented.
- Draft products intentionally have no `Product` or `Offer` schema.
- The Merchant feed lives at `/merchant-feed.xml` and remains empty until products are active, buyable, priced, in stock, and have approved imagery.
- Consent Mode v2 defaults analytics and advertising signals to denied. The footer reopens privacy settings.
- Configure either `NEXT_PUBLIC_GTM_ID` or the direct `NEXT_PUBLIC_GA4_ID` / `NEXT_PUBLIC_GOOGLE_ADS_ID` path, then verify consent transitions and DebugView.
- Configurator and inquiry events are emitted without personal data. Cart, checkout, purchase, and product-commerce events must be completed and tested only when those real flows are enabled.

## Local verification and preview

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. Run the complete checks before every preview deployment:

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e -- --workers=1
pnpm visual:check
```

Viewport captures are written to `.tmp/visual-check` for 360, 768, and 1440 px. The last local verification reported no page errors and no horizontal overflow.

## Vercel deployment steps (not executed)

1. Create or select the Vercel project and connect this repository.
2. Set Node/pnpm versions from `package.json`; use `pnpm build` as the build command.
3. Add every variable from `.env.example` separately for Development, Preview, and Production.
4. Use a development Supabase project and verified test Resend sender in Preview first.
5. Deploy a Preview, execute the verification checklist, validate forms/RLS/email/consent, and inspect generated metadata/feed.
6. Add `bistrava.com` and `www.bistrava.com` only after DNS access is approved; retain the configured canonical-host redirect.
7. Promote to Production only after supplier data, legal text, entity/contact details, analytics consent review, and product activation are approved.

## Mandatory manual inputs before launch

- Legal entity name, registered address, registration/VAT numbers, legal contact, and final Slovenian legal review.
- Real support email/telephone and service territory.
- Supplier price lists and official technical/product documents for the 24 candidates.
- Shipping carriers, regions, costs, lead times, return address/process, payment provider, and warranty workflow.
- Supabase, Resend, Vercel, DNS, GTM/GA4/Ads, and Merchant Center account access.
- Explicit list of products authorized as `active`; all others must remain draft or archived.
