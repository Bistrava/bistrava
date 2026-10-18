# Development roadmap

## Implemented foundation

- Brand-aligned responsive specialist storefront and complete public route structure.
- 24 enriched catalog drafts with images and verified supplier prices, plus a strict activation gate.
- Supabase SSR clients, session proxy, admin login, role checks, migrations, RLS, and storage policies.
- Validated quote/configurator/service forms, Supabase persistence, Resend templates, spam trap, and rate limiting.
- SEO metadata, sitemap, robots, Merchant feed, visible/schema-aligned FAQ, Article data, and canonical redirects.
- Versioned statistics consent, optional tags blocked until consent, advertising denied for launch, inquiry/configurator events, unit tests, E2E tests, and multi-viewport visual checks.

## Implemented administration

- Authenticated product, media, inventory, order, customer, shipping-rate, promotion, inquiry and guide administration.
- Staff authorization, audited transactional changes, optimistic concurrency and post-mutation revalidation.
- Realtime personal notifications and an LWS IMAP inbox with guarded SMTP replies.
- Administrator-managed bank-transfer settings with revision checks and immutable order snapshots.
- French/Slovenian administration. See [the administration guide](administration.md).

## Implemented cart and bank-transfer checkout

- Persistent browser cart, quantities, totals and commerce analytics events.
- Validated checkout, server-recalculated totals, transactional order creation, atomic stock reservation, idempotency and protected guest-order access.
- EUR bank-transfer instructions, order-confirmation emails, audited manual receipt confirmation, cancellation and stock release. See [the payment flow](payment-flow.md).
- Slovenian delivery rates with basket thresholds; carrier/tracking management from each order.
- Bank-transfer reservations intentionally require staff review instead of automatic expiry. The bank is not connected and incoming transfers are not detected automatically.
- Card payments, provider webhooks and customer accounts are separate optional extensions; they are not prerequisites for the implemented bank-transfer workflow.

## Remaining before opening sales

- PUREH2O identity, Erika Kozjan as representative, registered office/returns address, registration/VAT numbers, phone and absence of recognized IRPS provider are integrated locally. Finalize provider/privacy details after hosting configuration.
- The owner confirmed published selling prices and stock, preparation in 1–2 working days after payment confirmation, then delivery in 1–3 working days after dispatch. Verify product documentation, warranties and fulfillment arrangements.
- Verify the receiving bank account, deployed payment settings, delivery rates and mail delivery.
- Review the prepared shipping VAT migration and mixed-rate allocation with the accountant, then apply it to an approved test database before production. Its isolated tests preserve gross totals and historical snapshots.
- Verify the deployed Supabase migrations and authorization rules against the intended project, and keep test data isolated.
- Run type checking, lint, unit tests, production build, browser checks and the complete order workflow in an approved test environment.
- Validate the final measurement configuration. The prepared version removes presentation-only customer reviews and separates statistics consent from advertising.
- The apex domain is reachable and the administration redirects unauthenticated users to login as of 17 October 2026. DNS and account configuration still require inspection through the correct project access.
- Deploy a reviewable Preview, then obtain explicit approval to publish the final release and enable `CHECKOUT_ORDERING_ENABLED`.
- The owner selected preparation of Render instead of Vercel Pro. Docker/standalone output, a paid single-instance Frankfurt Blueprint and a Linux verification workflow are prepared; no subscription purchased. See [Render hosting](hosting-render.md).

Track the current verification evidence and owner inputs in [launch readiness](launch-readiness.md). Older delivery notes describe their original implementation date and must not be treated as a current deployment audit.
