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

- Apply migration `202610120021_bank_transfer.sql` after the preceding migrations.
- Set `BANK_TRANSFER_BENEFICIARY`, `BANK_TRANSFER_IBAN`, `BANK_TRANSFER_BANK_NAME` and optionally `BANK_TRANSFER_BIC` to the merchant's real receiving account. These are server configuration, intentionally displayed to customers as payment instructions. Never use example account data in production.
- Set `CHECKOUT_MODE=bank_transfer`. Set `CHECKOUT_ORDERING_ENABLED=true` only when the receiving account and commercial setup are ready. Missing/invalid bank details disable order creation even when the flag is true. Redeploy after Vercel environment changes.
- The alternative `manual_review` mode creates an unpaid pending order without bank instructions.

At implementation time, the owner has not supplied the receiving account and production ordering remains disabled. No real transfer or customer test email was sent.

Before accepting paid orders, complete the existing commercial checks: approved selling prices/stock, delivery arrangements, company details and terms. The existing `tax_cents` calculation covers product VAT only; VAT included in charged shipping still needs allocation before invoicing/paid launch. The customer-facing gross delivery/checkout total already includes the shipping charge; no extra VAT should be added to it.

## Verification

- Unit tests cover bank normalization/checksum, fail-closed configuration, status wording, email contents, duplicate/uncertain delivery and SMTP failure.
- `node scripts/test-promotions-db.mjs` runs migrations and SQL suites in an isolated PGlite database. The bank suite covers authorization, stock/idempotency, immutable account snapshots, explicit payment confirmation and cancellation/restocking.
