# Checkout and future payment flow

The browser cart, validated checkout form, atomic pending-order creation, stock reservation, protected guest-order link, and confirmation-email handoff are implemented. `CHECKOUT_MODE=manual_review` creates an explicitly unpaid order only when `CHECKOUT_ORDERING_ENABLED=true`.

No payment provider is selected or connected. `PaymentProvider` defines the server contract without pretending to process a real payment. Until a provider is approved, the interface and order page state that payment is not confirmed.

The future flow must be:

1. Validate cart and address with Zod, then re-read price, delivery, tax and stock on the server.
2. In the `create_pending_guest_order` database transaction, create a pending order with immutable item/address snapshots and reserve product inventory.
3. Create a provider payment session using a deterministic idempotency key.
4. Redirect the browser to the provider when required.
5. Receive a provider webhook at a dedicated Route Handler.
6. Verify the webhook signature against the raw request body before parsing it as trusted data.
7. Store the unique provider event, then transactionally update payment, order, stock, and audit records.
8. Send confirmation only after a verified paid event.

A success page in the browser is never payment confirmation. Duplicate events must be harmless through unique provider event IDs and idempotent state transitions.

## Activation checklist

Before enabling checkout:

1. Apply migration `202608240008_guest_checkout.sql` to Development first.
2. Set approved Bistrava selling prices in `products.price_cents`; never copy supplier observations automatically.
3. Mark only reviewed buy-now products `active`, `in_stock`, and published.
4. Insert real active Slovenian `shipping_zones` and `shipping_rates` values.
5. Validate VAT, delivery, returns, privacy and sales terms with the responsible business/legal owner.
6. Configure Supabase and, optionally, verified Resend credentials.
7. Set `CHECKOUT_MODE=manual_review` and `CHECKOUT_ORDERING_ENABLED=true` only after the above checks.
8. Keep the payment status pending until a future signed provider webhook confirms payment.
