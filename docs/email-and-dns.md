# Email and DNS

## Current state

`src/emails/inquiry-received.tsx` acknowledges Slovenian quote and service inquiries. `src/lib/email/send-inquiry.ts` sends the customer acknowledgement and internal notification with idempotency keys after the request is stored in Supabase. Delivery remains disabled until the Resend key, verified sender, reply-to, and internal recipient are configured.

Preview without sending:

```bash
pnpm email:dev
```

Open `http://localhost:3001`.

## Sender activation

The intended sender is:

```text
Bistrava <narocila@mail.bistrava.com>
```

Do not place it in `EMAIL_FROM` until Resend reports the domain as verified. DNS changes require explicit approval.

Resend will provide the exact records. The future checklist is:

- SPF TXT record authorizing the Resend sending infrastructure.
- DKIM records supplied by Resend for cryptographic signing.
- MX or Return-Path records requested by Resend for bounce handling.
- A DMARC TXT record, initially in monitoring mode, reviewed before enforcement.

Do not invent record names or values; copy the current values from the Resend domain screen after the domain is added.

## Delivery events

A future signed Resend webhook will record delivered, bounced, complained, suppressed, and failed events in `email_events`. Recipient addresses must be hashed in the operational ledger. Webhook authenticity must be verified before any status is trusted.

## Admin inbox integration status (9 October 2026)

The Messages page subscribes to `quote_requests` and the email ledger subscribes to `email_events`. Migration `202610090018` adds both tables to `supabase_realtime` while preserving staff-only reads and removing browser insertion into the email ledger. The UI pauses refreshes while notes are being edited and falls back to polling every 30 seconds while visible.

No email integration is attached to the Bistrava Vercel project, and production has no `RESEND_API_KEY`, `EMAIL_FROM`, or `EMAIL_REPLY_TO`. The ledger is not an incoming mailbox; the existing notification senders do not yet record their outcomes there. No direct reply composer or inbound email webhook is enabled.

Before implementing receiving and replies, confirm the actual Bistrava email address, its current provider, and an owned sending domain. Resend was discovered in Vercel Marketplace as `resend/resend-email`; provisioning requires the real domain. Preserve existing mailbox MX records; use a verified receiving subdomain or mailbox forwarding where appropriate.

The owner has confirmed purchasing `bistrava.com` from LWS and reports waiting for DNS propagation. No DNS or mailbox configuration was changed during the admin notification work. The actual mailbox address and whether email hosting is provisioned at LWS remain to be confirmed.

The later implementation must persist incoming and outgoing messages, verify signed webhooks using the raw request body, deduplicate provider events, enforce staff authorization, and send replies with stable idempotency keys. Keep RFC message IDs separate from provider UUIDs for threading. Display escaped text, and test deliveries only to an explicitly approved recipient.
