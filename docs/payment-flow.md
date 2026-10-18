# Bank transfer checkout

`CHECKOUT_MODE=bank_transfer` offers an offline EUR bank transfer. This does not connect to the merchant's bank or detect incoming funds automatically.

## Customer and administrator flow

1. Checkout displays the beneficiary, IBAN, bank and optional BIC from server configuration. The customer reviews the server-calculated products, discount, shipping and final total.
2. Submitting creates an `awaiting_payment` order through `create_bank_transfer_order`, with immutable item, address and bank snapshots. Stock is reserved atomically. Repeating the same request does not create another order or reserve stock twice.
3. The protected order page and confirmation email show the exact EUR amount and order reference to include in the transfer. The customer makes the transfer through their own bank.
4. An administrator checks their bank statement, then confirms receipt of the full amount in the order interface, supplying a payment reference. Only this audited action changes the order/payment to paid. Preparing and shipping follow the existing order workflow.
5. An unpaid order can be cancelled by staff, restoring its reserved stock. Bank transfer reservations do not expire automatically; staff must review unpaid orders. No automatic payment deadline is promised.

Changing bank configuration applies only to new orders. Stored instructions for existing orders cannot be edited. The order reference alone does not grant access to customer data; the guest cookie is still required.

## Email

With `LWS_MAIL_PASSWORD` configured, bank instructions use the existing authenticated LWS SMTP transport as `kontakt@bistrava.com`. A database idempotency reservation prevents duplicate delivery. Failed or uncertain sends are recorded in `email_events` without automatic retries. Email failure does not invalidate a committed order, and the confirmation page retains the payment instructions. Resend remains an optional fallback when LWS is unconfigured.

## Configuration and activation

Administrators can now manage the receiving account at `/admin/placila` (Payments in the sidebar). The form supports disabled drafts, a Slovenian customer preview, validated activation and optimistic concurrency. Editors cannot read or change these settings. Changes are audited with a masked IBAN; existing order snapshots remain immutable.

Once settings are saved, `payment_settings` is the authoritative source. New checkout requests read it directly without a redeploy. A database failure closes checkout instead of reverting to old environment account details. Both the displayed revision and the database account are checked when placing an order, to reject obsolete instructions.

The payment-method switch does not override the separate `CHECKOUT_ORDERING_ENABLED` store-opening gate. The admin page clearly reports when orders are still closed. Legacy environment account settings below are only a fallback before the first admin save.

- Apply migration `202610120021_bank_transfer.sql` after the preceding migrations.
- Set `BANK_TRANSFER_BENEFICIARY`, `BANK_TRANSFER_IBAN`, `BANK_TRANSFER_BANK_NAME` and optionally `BANK_TRANSFER_BIC` to the merchant's real receiving account. These are server configuration, intentionally displayed to customers as payment instructions. Never use example account data in production.
- Set `CHECKOUT_MODE=bank_transfer`. Set `CHECKOUT_ORDERING_ENABLED=true` only when the receiving account and commercial setup are ready. Missing/invalid bank details disable order creation even when the flag is true. Redeploy after Vercel environment changes.
- The alternative `manual_review` mode creates an unpaid pending order without bank instructions.

The owner has entered the beneficiary, IBAN, bank and BIC through the administration interface and saved a disabled draft. Only configuration/readiness booleans were verified; no bank account details are stored in this repository. Production ordering remains disabled. No real transfer or customer test email was sent.

Before accepting paid orders, complete the existing commercial checks: approved selling prices/stock, delivery arrangements, company details and terms. The local shipping-VAT correction below must be reviewed and applied before invoicing/paid launch; its mixed-rate allocation and rounding policy still require approval by the operator/accountant. The customer-facing delivery/checkout total already includes the shipping charge; no extra VAT is added to it.

## VAT included in shipping

Migration `20261017172838_shipping_vat_included.sql` is prepared locally and has not been applied to production. It retains the exact quoted gross total and payment amount:

`total_cents = subtotal_cents - discount_cents + shipping_cents`

For newly created orders, `shipping_tax_cents` records the VAT share already included in delivery. `orders.tax_cents` becomes product VAT plus shipping VAT. Product discounts and the established per-line product VAT rounding remain unchanged. Shipping eligibility thresholds remain based on the subtotal before discounts.

The allocation uses each stored product snapshot's VAT rate and gross amount after its allocated discount. It groups those amounts by rate, then apportions gross shipping proportionally between the groups. Rates are ordered numerically ascending; cumulative half-up rounding assigns every gross shipping cent exactly once. VAT included in each group is `round(shippingGrossCents * rate / (100 + rate))`. The order stores a versioned immutable `shipping_tax_snapshot` with the method, rounding, allocation basis and each group's gross, net and VAT shipping amounts. Later catalogue, tax-rate or shipping-price edits do not change existing orders or idempotent replays.

Free delivery has zero shipping VAT. When all products are fully discounted, a basket containing a single rate uses that rate for charged delivery. A fully discounted mixed-rate basket with charged delivery fails atomically with `shipping_tax_allocation_requires_accountant_review`; no order, stock reservation, payment or promotion use remains. This case needs an agreed accounting policy. A mixed-rate basket with fully discounted products and free delivery remains calculable at zero shipping VAT.

Historical orders keep `shipping_tax_cents` and `shipping_tax_snapshot` as `NULL`, meaning not calculated, including when their original idempotency key is replayed. The migration does not backfill old orders, imply that their shipping VAT was zero or amend existing invoices. Any historical correction requires a separate accounting decision.

The legal basis for including supplier-charged incidental transport in the taxable amount is [ZDDV-1, Article 36(5)(b)](https://pisrs.si/pregledPredpisa?id=ZAKO4701) and [Directive 2006/112/EC, Articles 78–79](https://eur-lex.europa.eu/eli/dir/2006/112/2025-04-14/eng). An ancillary supply shares the principal supply's tax treatment under [CJEU C-349/96, paragraph 30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A61996CJ0349). These provisions support allocating incidental delivery to the underlying supplies; they do not prescribe this implementation's precise mixed-rate allocation or rounding formula. The operator/accountant must confirm those policies, product rate classifications and invoicing treatment before production use. This domestic SI checkout calculation does not establish treatment for foreign sales, exemptions, advances or credit notes.

## Staff operation

Staff should review unpaid bank-transfer orders daily because stock remains reserved without an automatic bank-transfer expiry. Check the actual receiving bank statement and match the full amount and order reference before using receipt confirmation in the order interface; the checkout page or a customer's claim of transfer does not establish receipt. Review failed/uncertain confirmation deliveries in the email-event queue and verify delivery status before manually contacting the customer or retrying, to avoid duplicate instructions. Existing order instructions stay available on the protected order page even if the email failed. The operator decides when to contact the customer or cancel an unpaid order; the system does not invent an automatic deadline.

## Verification

- Unit tests cover bank normalization/checksum, fail-closed configuration, status wording, email contents, duplicate/uncertain delivery and SMTP failure.
- `node scripts/test-promotions-db.mjs` runs migrations and SQL suites in an isolated PGlite database. The bank suite covers authorization, stock/idempotency, immutable account snapshots, explicit payment confirmation and cancellation/restocking.
- The shipping-VAT suite covers standard/reduced/zero and mixed rates, promotions, free and one-cent delivery, fully discounted baskets, atomic mixed-rate rejection, immutable fiscal snapshots, idempotent replays, bank-transfer amounts and internal-function permissions. A pre-migration fixture verifies that historical amounts and unknown shipping VAT remain unchanged. For the existing discounted `303 - 30 + 500 = 773` fixture, the gross payment remains 773 cents while the recorded VAT changes from product-only 49 to 139 cents, including 90 cents of shipping VAT.
