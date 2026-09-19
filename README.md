# Bistrava

Bistrava is a Slovenian specialist storefront for soft water and scale prevention. It uses Next.js App Router, TypeScript, Tailwind CSS, Supabase, Resend, React Email, Zod, Vitest, and Playwright.

The public experience includes the specialist information architecture, a deterministic softener configurator, protected inquiry flows, ten editorial guide drafts, technical SEO, Consent Mode v2, and a catalog activation gate. The retained catalog contains 24 enriched specialist drafts with verified Slovenian copy, technical specifications, supplier-source provenance, prices, and four-image galleries. Source references without both an image and a price are excluded and removed from Supabase. No product is presented as purchasable until its commercial data is approved and its database status is explicitly changed to `active`.

## Local development

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. The app builds without external credentials; active Supabase catalog reads and email delivery remain disabled until valid variables are present.

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Re-import the preserved SEO workbook after changing its catalog rows:

```bash
pnpm catalog:import
```

Regenerate the reviewable SQL for the 24 specialist drafts:

```bash
pnpm catalog:seed:sql
```

After importing the 24 specialist drafts, upload their four-image galleries to
the `product-media` Storage bucket and link them in `product_images`:

```bash
node scripts/upload-product-media.mjs
pnpm catalog:media:upload
```

The first command checks all 96 files without writing. The upload keeps raster
assets unchanged and converts the 47 local SVG information panels to PNG for
the bucket's allowed media types.

Run the viewport screenshot check against the local server:

```bash
pnpm visual:check
```

Preview the Slovenian order confirmation email on port 3001:

```bash
pnpm email:dev
```

## Documentation

- `docs/architecture.md`
- `docs/data-model.md`
- `docs/development-roadmap.md`
- `docs/environment.md`
- `docs/email-and-dns.md`
- `docs/payment-flow.md`
- `docs/catalog-import.md`
- `docs/repositioning-delivery.md`

Brand source files are preserved under `brand/`. The provided PNG is archived
unchanged; because its checkerboard is flattened into the pixels, the clean web
logo under `brand/derived/` is a deterministic crop of the official signature in
the PDF charter. `scripts/prepare-brand-assets.ps1` documents that derivation.
Do not overwrite source files when producing future variants.
