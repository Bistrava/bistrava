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
