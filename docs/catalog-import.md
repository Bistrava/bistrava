# SEO catalog import

The preserved source workbook is
`data/source/Bistrava-SEO-Keywords-Slovenia.xlsx`. The import reads only the
`SEO katalog SL` sheet; text in the workbook's instruction sheet is reference
material and is not executed.

## Rebuild the generated catalog

```bash
pnpm catalog:import
pnpm typecheck
pnpm test
```

The import script validates every required value, rejects unmapped categories,
and fails on duplicate product IDs or slugs. Its only generated output is
`src/lib/catalog/seo-products.generated.json`. Category presentation and
installation guidance live in `src/lib/catalog/catalog.ts`. Verified Slovenian
product copy lives in `src/lib/catalog/product-content.verified.json`; the
four-image manifests live in `src/lib/catalog/product-media.generated.json`.

To store the retained catalog in a linked Supabase project, generate and review
the specialist SQL file. It imports the 24 drafts that have both product images
and a verified supplier price. Other source references are not seeded.

```bash
pnpm catalog:seed:sql
pnpm dlx supabase db query --linked --file supabase/seed-specialist-products.sql
```

The generated files do not create public offers. To transfer the four-image
galleries for the 24 specialist drafts, first check the local files and then
upload them to the public `product-media` bucket:

```bash
node scripts/upload-product-media.mjs
pnpm catalog:media:upload
```

The script links each uploaded object to `product_images`. It preserves raster
source files and converts 47 SVG information panels to PNG because the bucket
allows raster media only. The original files remain under `public/products`.

## Current publication state

The 24 retained specialist drafts have a unique Slovenian route, title, H1,
meta-description, self-referencing canonical, parent category, breadcrumbs,
original
Slovenian descriptions, supplier-sourced specifications, traceable public price
observations, and four-image galleries. They remain `noindex, follow` and are
excluded from the sitemap until Bistrava approves availability, warranty,
selling price, and publication status.

No `Product`, `Offer`, `Review`, or `FAQPage` structured data is emitted for a
draft card. The visible page distinguishes supplier-verified technical data and
public retail observations from the commercial fields that still require
Bistrava approval.

## Gate for public indexing

Before changing a product to an indexable and purchasable state, record and
verify at least:

- official product name, model, SKU, MPN and GTIN where assigned;
- manufacturer or authorized supplier source;
- original product images and meaningful Slovenian alt text;
- technical specifications, dimensions, operating limits and compatibility;
- package contents, installation requirements and maintenance schedule;
- evidence for filtration, removal, laboratory or health-related claims;
- gross EUR price, VAT treatment, stock state and delivery estimate;
- warranty, returns, shipping and service conditions.

Only then should the product be added to the sitemap, allowed to index, and
receive accurate `Product` and `Offer` structured data matching the visible
page.
