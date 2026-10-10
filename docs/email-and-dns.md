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

On 10 October 2026, the owner confirmed creating the LWS mailbox `kontakt@bistrava.com`; the supplied LWS Panel screenshot shows the mailbox as Standard. This is the confirmed business contact address. Mailbox credentials have not been supplied or stored, and this confirmation alone does not connect the mailbox to the admin interface.

The subsequent LWS configuration screenshot confirms authenticated IMAP on port 993 and SMTP on port 465 with SSL/TLS. Both accept `mail.bistrava.com` or `mail60.lwspanel.com` as the server. The implementation uses the provider hostname with certificate validation and TLS 1.2 minimum. Username: `kontakt@bistrava.com`. Port 587 is also listed by LWS but is not selected. The owner entered `LWS_MAIL_PASSWORD` directly in the Bistrava Vercel Production environment as a Secret; its presence and type were verified without reading its value. No test email is authorized by providing these settings alone.

The domain `bistrava.com` and `www.bistrava.com` are attached to the Bistrava Vercel project. Vercel verified both DNS configurations on 10 October 2026. HTTPS tests against the new Vercel address returned 200 for the apex and 308 from `www` to the apex; some local DNS caches still returned the former LWS web address. The LWS mail records were preserved. The mailbox connection and sending-domain verification remain separate pending steps.

## LWS inbox implementation (10 October 2026)

- `/admin/e-posta` displays the latest 100 imported incoming emails, text bodies and reply history. Older messages remain stored and are accessible from a notification link. IMAP imports INBOX forward in batches of 20; repeated syncs catch up with older mail. No mailbox messages are deleted or flagged remotely.
- `/admin/mailbox` requires active staff authorization for every request. Writes require a matching Origin. Credentials stay server-side. RLS permits only staff reads; writes use the guarded server route and service role.
- `MailboxSync` polls once per minute while an admin workspace tab is visible. A database lease with a 45-second throttle deduplicates tabs and instances. This is not an always-on background inbox service; mail arriving while the administration is closed is imported upon reopening it.
- Migration 020 stores messages, replies and cursor state. UIDVALIDITY + UID prevents duplicate imports. Each incoming message atomically creates an `email_events` notification with the same UUID. Opening message content marks the personal notification read. The separate event ledger excludes incoming records so simply opening the ledger does not acknowledge unread mail.
- Only plain text is rendered. Remote images and HTML are never rendered. MIME messages over 2 MB have envelope-only previews, and text bodies are capped at 100,000 characters. Attachments are listed, not downloaded; use LWS webmail for attachment access or full large messages.
- Replies go to the parsed Reply-To (or From) of an existing imported message. The browser cannot supply an arbitrary recipient. RFC Message-ID/In-Reply-To/References preserve threading. Replies are retained in Bistrava's history; they are not copied to LWS's Sent folder.
- A reply UUID is persisted before SMTP. Repeating that UUID does not resend. Pending/uncertain sends block additional replies to that message until investigated, including after process termination; never automatically retry SMTP after an ambiguous result. A database guard caps admin replies at 50/hour. `sent` means accepted by LWS SMTP, not proof of delivery to the recipient.
- The SMTP check authenticates only, sends zero messages, and persists its timestamp. Existing Resend-based transactional order/form emails are separate and remain inactive without their provider configuration.

Before claiming production readiness, verify authenticated IMAP sync and SMTP authentication on the deployed runtime. End-to-end message delivery requires an explicitly approved test recipient.
