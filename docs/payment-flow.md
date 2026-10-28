# Bank transfer checkout

`CHECKOUT_MODE=bank_transfer` offers an offline EUR bank transfer. This does not connect to the merchant's bank or detect incoming funds automatically.

## Customer and administrator flow

1. Checkout explains payment by bank transfer without displaying or serializing the beneficiary, IBAN, bank or BIC. The customer reviews the server-calculated products, discount, shipping and final total.
2. Submitting creates an `awaiting_payment` order through `create_bank_transfer_order`, with immutable item, address and bank snapshots. Stock is reserved atomically. Repeating the same request does not create another order or reserve stock twice.
3. After confirmation, the automatic email supplies the saved bank details, exact EUR amount and order reference. The protected order page directs the customer to that email and never displays bank details. The customer makes the transfer through their own bank and replies with proof and their order reference to speed up processing.
4. Receipt of that proof finalizes the customer's order. An administrator records the received email/document reference using the separate proof form in the order interface. `admin_confirm_transfer_proof` saves the timestamp and reference and creates one audit event; retries neither overwrite the first proof nor duplicate the event. The customer page then shows “Naročilo dokončno potrjeno”. Cancelled/refunded orders cannot be finalized.
5. Proof receipt does not mark funds as received or complete delivery. An administrator separately checks their bank statement and confirms receipt of the full amount with its payment reference. Only that action changes order/payment to paid. Preparing and shipping follow the existing order workflow.
6. An unpaid order can be cancelled by staff, restoring its reserved stock. Bank transfer reservations do not expire automatically; staff must review unpaid orders. No automatic payment deadline is promised.

Changing bank configuration applies only to new orders. Stored instructions for existing orders cannot be edited. The order reference alone does not grant access to customer data; the guest cookie is still required.

## Email

With `LWS_MAIL_PASSWORD` configured, bank instructions use the existing authenticated LWS SMTP transport as `kontakt@bistrava.com`, also the reply-to address for proof. SMTP and the Resend HTML fallback both request proof and explain that its receipt finalizes the order. A database idempotency reservation prevents duplicate SMTP delivery. Failed or uncertain sends are recorded in `email_events` without automatic retries. Email failure does not invalidate a committed order; the confirmation page advises checking spam or contacting the store. Resend remains an optional fallback when LWS is unconfigured. Proofs are received in the existing mailbox; an administrator records receipt after reviewing the customer's email. No automatic attachment classification is performed.

Apply `20261019010016_bank_transfer_proof.sql` before deploying these application changes: guest and admin queries read its new proof columns. It keeps existing RLS, uses an invoker function with explicit admin authorization, row locking and a revision check, and does not change existing orders or payments. The Render Blueprint now enables the store ordering switch, in line with the owner's confirmation that sales are open; actual runtime settings must also have `CHECKOUT_ORDERING_ENABLED=true` and valid enabled bank details.

## Configuration and activation

Administrators can now manage the receiving account at `/admin/placila` (Payments in the sidebar). The form supports disabled drafts, a Slovenian customer preview, validated activation and optimistic concurrency. Editors cannot read or change these settings. Changes are audited with a masked IBAN; existing order snapshots remain immutable.

Once settings are saved, `payment_settings` is the authoritative source. New checkout requests read it directly without a redeploy. A database failure closes checkout instead of reverting to old environment account details. Both the displayed revision and the database account are checked when placing an order, to reject obsolete instructions.

The payment-method switch does not override the separate `CHECKOUT_ORDERING_ENABLED` store-opening gate. The admin page clearly reports when orders are still closed. Legacy environment account settings below are only a fallback before the first admin save.

- Apply migration `202610120021_bank_transfer.sql` after the preceding migrations.
- Set `BANK_TRANSFER_BENEFICIARY`, `BANK_TRANSFER_IBAN`, `BANK_TRANSFER_BANK_NAME` and optionally `BANK_TRANSFER_BIC` to the merchant's real receiving account. These are server configuration, intentionally displayed to customers as payment instructions. Never use example account data in production.
- Set `CHECKOUT_MODE=bank_transfer`. Set `CHECKOUT_ORDERING_ENABLED=true` only when the receiving account and commercial setup are ready. Missing/invalid bank details disable order creation even when the flag is true. Redeploy after Vercel environment changes.
- The alternative `manual_review` mode creates an unpaid pending order without bank instructions.

The owner has entered the beneficiary, IBAN, bank and BIC through the administration interface and saved a disabled draft. Only configuration/readiness booleans were verified; no bank account details are stored in this repository. Production ordering and bank transfer remain disabled. No real transfer, production order or bank-instruction email has been created. An explicitly authorized contact test confirmed receipt of the acknowledgement and internal notification; no order was created. This contact test does not verify an order-confirmation email.

The owner has confirmed the published selling prices/stock, company and return details, and that the carrier and return arrangements are ready. Preparation takes 1–2 business days after confirmed payment, followed by 1–3 business days of transport after dispatch. Erika Kozjan, the Director responsible for invoices, has approved the current 22% calculation, unchanged gross prices, rounding per product line and use of those recorded amounts in external invoices, including shipping VAT. The future allocation between multiple rates still needs separate approval; it does not block the current catalogue, whose eligible products are all at 22%. Migration/recovery checks and application of the shipping-VAT correction remain to be completed before invoicing/paid launch. The customer-facing delivery/checkout total already includes the shipping charge; no extra VAT is added to it.

## VAT included in shipping

Migration `20261017172838_shipping_vat_included.sql` is prepared locally and has not been applied to production. Targeted recovery and transactional rejection/atomic-rollback checks have passed locally; no production DDL has been executed. The migration must be applied before deploying the new Admin fiscal view, because its order selection reads `shipping_tax_cents` and `shipping_tax_snapshot`. The currently deployed Render source remains the mail-verified reference `0e8188b`. The migration retains the exact quoted gross total and payment amount:

`total_cents = subtotal_cents - discount_cents + shipping_cents`

For newly created orders, `shipping_tax_cents` records the VAT share already included in delivery. `orders.tax_cents` becomes product VAT plus shipping VAT. Product discounts and the established per-line product VAT rounding remain unchanged. Shipping eligibility thresholds remain based on the subtotal before discounts.

### Approved current 22% calculation

On 18 October 2026, the owner confirmed “Calcul validé par Erika”. Erika Kozjan's approval covers retaining gross prices, computing included VAT per product line as `round(discountedLineGrossCents * 22 / 122)` in cents, summing those rounded line amounts, and carrying the recorded figures into external invoices. Included shipping VAT at the current single rate uses the same `22 / 122` extraction from gross delivery.

| Approved example | Included VAT |
| --- | --- |
| One product line at €40.00 gross | €7.21 |
| Two product lines at €20.00 gross each | €3.61 per line, €7.22 total |
| Delivery at €4.50 gross | €0.81 VAT, €3.69 net |

The difference between the two €40.00 baskets is the approved per-line rounding effect; invoice preparation must preserve those recorded cents rather than round the combined product total again. This approval covers the current 22% catalogue and invoice transfer of these amounts. It does not approve the future proportional allocation between different VAT rates.

### Stored allocation and future mixed rates

The allocation uses each stored product snapshot's VAT rate and gross amount after its allocated discount. It groups those amounts by rate, then apportions gross shipping proportionally between the groups. Rates are ordered numerically ascending; cumulative half-up rounding assigns every gross shipping cent exactly once. VAT included in each group is `round(shippingGrossCents * rate / (100 + rate))`. The order stores a versioned immutable `shipping_tax_snapshot` with the method, rounding, allocation basis and each group's gross, net and VAT shipping amounts. Later catalogue, tax-rate or shipping-price edits do not change existing orders or idempotent replays. The multiple-rate allocation is implemented for testing but remains outside Erika's current single-rate approval.

Free delivery has zero shipping VAT. When all products are fully discounted, a basket containing a single rate uses that rate for charged delivery. A fully discounted mixed-rate basket with charged delivery fails atomically with `shipping_tax_allocation_requires_accountant_review`; no order, stock reservation, payment or promotion use remains. This future mixed-rate case still needs an agreed accounting policy and is outside the current all-22% catalogue. A mixed-rate basket with fully discounted products and free delivery remains calculable at zero shipping VAT.

Historical orders keep `shipping_tax_cents` and `shipping_tax_snapshot` as `NULL`, meaning not calculated, including when their original idempotency key is replayed. The migration does not backfill old orders, imply that their shipping VAT was zero or amend existing invoices. Any historical correction requires a separate accounting decision.

The legal basis for including supplier-charged incidental transport in the taxable amount is [ZDDV-1, Article 36(5)(b)](https://pisrs.si/pregledPredpisa?id=ZAKO4701) and [Directive 2006/112/EC, Articles 78–79](https://eur-lex.europa.eu/eli/dir/2006/112/2025-04-14/eng). An ancillary supply shares the principal supply's tax treatment under [CJEU C-349/96, paragraph 30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A61996CJ0349). These provisions support allocating incidental delivery to the underlying supplies; they do not prescribe this implementation's precise mixed-rate allocation or rounding formula. Erika Kozjan has approved the current 22% examples, rounding and invoice treatment described above. Future mixed-rate allocation still requires a separate decision before it is offered; it is not a blocker for the current all-22% catalogue. This domestic SI checkout calculation does not establish treatment for foreign sales, exemptions, advances or credit notes.

## Pre-migration capture and recovery

The targeted pre-migration capture records PostgreSQL 17.6 and 23 migration versions through `20261013001136`. At capture time, `orders`, `order_items` and `payments` each contain zero rows, and candidate migration `20261017172838` is not recorded. Its shipping-VAT columns, calculator, guard, trigger and constraint are absent.

The artifact preserves the affected order schema and the original `create_pending_guest_order` definition, ownership, permissions and function settings for targeted recovery. It contains no customer or bank data. Targeted local rollback using this real capture has passed. The transactional wrapper also passed six rejection cases, with atomic rollback verified. No production DDL has been executed. This remains a targeted schema capture, not a full database backup; no complete backup or verified complete restore has been performed.

## Read-only data for external invoicing

The local seven-file fiscal change exposes saved item rates, allocated discounts, discounted gross, line net and VAT, the saved shipping allocation and reconciled totals by rate. It derives net only by subtracting recorded VAT from recorded discounted gross, includes shipping once and preserves missing historical values as unknown. It supports Erika Kozjan's external invoice preparation using the approved 22% per-line amounts; it does not issue, number or post an invoice. Future multiple-rate allocation remains a separate approval and does not block the current all-22% catalogue.

Local validation passed 38 files/215 tests, TypeScript and targeted lint. The existing isolated A/B checkout scenario now includes DOM assertions for the fiscal view and a synthetic `admin-accounting.png` capture. The revised scenario, its CI artifact and the new Vercel Preview await publication and execution; the previous successful `0e8188b` CI is the historical mail/application reference, not proof of the new fiscal change. No future commit identifier is assigned here.

The migration-before-deployment order is mandatory because the new repository query selects the added columns. The final grouped approval for migration, subsequent fiscal deployment and store opening is still to be requested. Production ordering and bank transfer remain disabled; the one authorized contact test did not create an order or send bank instructions.

## Card payments (Stripe)

Checkout also displays the card option when Stripe is unconfigured, without any card fields or “coming soon” label. With ordering open and a valid checkout form, clicking Pay shows the temporary-unavailability message and a button to select bank transfer. Contact details and the cart remain in the form; no order, stock reservation or payment is created by this attempt. The existing store-opening gate still applies.

The `notifyCardAttempt` action validates the checkout and reuses the rate-limited server quote before sending a `checkout_card_attempt` notification to `kontakt@bistrava.com`. The email explicitly describes an unpaid attempt, with contact/address details, item SKUs and quantities, delivery, discount and server-calculated total. Only explicitly selected fields enter the email; access tokens and arbitrary extra fields do not. No card fields are rendered in this flow. The customer sees a notice that their contact details and cart summary will be sent to the store when they click.

The existing SMTP transport reserves a unique `card-attempt:<checkout idempotency key>` in `email_events`, preventing duplicate or uncertain sends from being retried. Resend is the existing fallback when SMTP is not configured, using the same provider idempotency key. Delivery failures never block the switch to bank transfer and never claim successful notification to the customer. Actual delivery requires the existing mail and database configuration; local verification uses mocked transport, not a real customer email.

Configured Stripe payments continue to use the secure Payment Element.

Card number, expiry and security code are entered in Stripe's Payment Element inside the checkout page. They go directly to Stripe; no card data reaches Bistrava's server, database, logs or admin (PCI DSS scope stays at SAQ A). The admin shows only the payment state, amount and PaymentIntent id.

1. The customer chooses "Plačilo s kartico". The browser validates the Stripe fields, then the checkout action creates the order through `create_card_order` (same stock reservation, discounts and idempotency as other orders; status `awaiting_payment`, `checkout_mode='card'`, payment provider `stripe`).
2. The server creates a PaymentIntent for the amount stored on the order (`allowed_payment_method_types: ['card']`, idempotency key per order) and stores its id with `attach_card_payment_intent`. Only the client secret goes back to the browser, which confirms the payment (3-D Secure when the bank requires it).
3. `POST /api/stripe/webhook` verifies the Stripe signature and passes `payment_intent.succeeded`, `payment_intent.payment_failed` and `payment_intent.canceled` to `record_card_payment_event`. Each event id is applied once; success requires the exact EUR amount of the order, marks payment and order paid, writes an audit log and triggers one confirmation e-mail (`card-paid:<order id>`). A wrong amount is recorded as `amount_mismatch` and never marks the order paid; a payment after cancellation is recorded as `paid_after_cancellation` for staff refund.
4. If the webhook is late, the protected order page retrieves the PaymentIntent from Stripe and records its final state the same way.
5. Payment details by e-mail: moving an order to `awaiting_payment` in the admin, or the "Send payment details" button on an order awaiting payment, e-mails the bank instructions (bank-transfer orders) or a signed card payment link `/placilo/<reference>?k=<HMAC>` (card orders; key derived from `RATE_LIMIT_SALT`). The page shows only the reference, items and amount, and pays the order's existing PaymentIntent, so an earlier checkout attempt can never be paid twice.
6. A declined card leaves the order `awaiting_payment` with payment `failed`; the customer can retry from the checkout page without creating a second order. Unpaid card orders keep their reservation until staff cancel them, like bank transfers.

Activation: apply `20261025000100_stripe_card_payments.sql`, set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` and `STRIPE_WEBHOOK_SECRET` (test keys first) in Render, register the webhook endpoint `https://bistrava.com/api/stripe/webhook` for the three events above, then redeploy. Without all three keys the visible card option uses the unavailable-card notification flow above; it cannot collect card details or payment. Refunds are made in the Stripe Dashboard.

## Staff operation

Staff should review unpaid bank-transfer orders daily because stock remains reserved without an automatic bank-transfer expiry. Record received proof using the dedicated proof form, then check the actual bank statement and match the full amount and order reference before confirming funds. Review failed/uncertain confirmation deliveries in the email-event queue and verify delivery status before manually contacting the customer or retrying, to avoid duplicate instructions. Bank instructions are supplied by email only. The operator decides when to contact the customer or cancel an unpaid order; the system does not invent an automatic deadline.

## Verification

- Unit tests cover bank normalization/checksum, fail-closed configuration, status wording, email contents, duplicate/uncertain delivery and SMTP failure.
- `node scripts/test-promotions-db.mjs` runs migrations and SQL suites in an isolated PGlite database. The bank suite covers authorization, stock/idempotency, immutable account snapshots, explicit payment confirmation and cancellation/restocking.
- The shipping-VAT suite covers standard/reduced/zero and mixed rates, promotions, free and one-cent delivery, fully discounted baskets, atomic mixed-rate rejection, immutable fiscal snapshots, idempotent replays, bank-transfer amounts and internal-function permissions. A pre-migration fixture verifies that historical amounts and unknown shipping VAT remain unchanged. For the existing discounted `303 - 30 + 500 = 773` fixture, the gross payment remains 773 cents while the recorded VAT changes from product-only 49 to 139 cents, including 90 cents of shipping VAT.
