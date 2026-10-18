# Email and DNS

## Current state (18 October 2026)

The confirmed Bistrava mailbox is `kontakt@bistrava.com` on LWS. On 17 October, the deployed administration reported a successful IMAP synchronization and SMTP authentication. The SMTP check performs a handshake only and sends no message. No mailbox contents or credentials were copied for this check. End-to-end delivery to a real recipient has not been verified and still requires an explicitly authorized test recipient.

Bank-transfer order instructions use authenticated LWS SMTP when `LWS_MAIL_PASSWORD` is configured. The receiving account was saved by the owner as a disabled draft in `/admin/placila`; its values were not copied into the repository. Ordering remains closed. A committed bank-transfer order would be `awaiting_payment`, with a pending payment until staff confirm receipt of funds; SMTP acceptance does not establish payment or recipient delivery.

`src/emails/inquiry-received.tsx` acknowledges Slovenian quote and service inquiries. `src/lib/email/send-inquiry.ts` sends the customer acknowledgement and internal notification with idempotency keys after the request is stored in Supabase. These inquiry notifications still require their separate Resend key, verified sender, reply-to and internal recipient. Resend also remains the order-email fallback when the LWS transport is unconfigured; the LWS handshake does not activate Resend.

The review branch is published in [draft PR #1](https://github.com/Bistrava/bistrava/pull/1), HEAD `c0ef8d017bd864f77809a348d7dd4cd64a132e8e`. The [successful Linux CI run](https://github.com/Bistrava/bistrava/actions/runs/39082019805) uses isolated data and no production credentials, sends no real email and creates no remote order. The Ready [Vercel contact preview](https://bistrava-git-codex-finalisation-render-bistrava.vercel.app/kontakt) was checked read-only for public seller/return details. A complete connected Supabase order and real-recipient delivery remain separate checks.

Render login and the creation form are prepared. The owner has approved paid creation and the presented charges. Clicking Deploy opened Add Card, which requires the owner's direct entry; no service ID, URL or creation confirmation has been observed. No Supabase or LWS secret has been transferred to Render. Its initial instance will be unconfigured; repeat the IMAP/SMTP authentication checks from that runtime after configuration is approved. See [Render preparation](hosting-render.md) and [launch readiness](launch-readiness.md).

Preview without sending:

```bash
pnpm email:dev
```

Open `http://localhost:3001`.

## Optional Resend sender activation

The proposed Resend sender is separate from the active LWS mailbox:

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

## Integration history

### 9 October 2026

The Messages page subscribes to `quote_requests` and the email ledger subscribes to `email_events`. Migration `202610090018` adds both tables to `supabase_realtime` while preserving staff-only reads and removing browser insertion into the email ledger. The UI pauses refreshes while notes are being edited and falls back to polling every 30 seconds while visible.

At that stage, no Resend integration was attached to the Bistrava Vercel project, and the production settings inspected had no `RESEND_API_KEY`, `EMAIL_FROM`, or `EMAIL_REPLY_TO`. The event ledger was not an incoming mailbox and no direct reply composer or inbound email webhook was enabled. The LWS implementation below supersedes that inbox/reply status; inquiry notifications still have their separate Resend configuration.

Resend was discovered in Vercel Marketplace as `resend/resend-email`; it was not provisioned by that discovery. Its sender-domain verification remains distinct from configuring the LWS mailbox. Preserve existing mailbox MX records if any optional provider is introduced.

### 10 October 2026

The owner confirmed creating the LWS mailbox `kontakt@bistrava.com`; the supplied LWS Panel screenshot showed the mailbox as Standard. This is the confirmed business contact address. Credentials were entered directly into the server environment as described below; they are not stored in this repository. Mailbox creation alone did not verify the connection to the administration.

The subsequent LWS configuration screenshot confirms authenticated IMAP on port 993 and SMTP on port 465 with SSL/TLS. Both accept `mail.bistrava.com` or `mail60.lwspanel.com` as the server. The implementation uses the provider hostname with certificate validation and TLS 1.2 minimum. Username: `kontakt@bistrava.com`. Port 587 is also listed by LWS but is not selected. The owner entered `LWS_MAIL_PASSWORD` directly in the Bistrava Vercel Production environment as a Secret; its presence and type were verified without reading its value. No test email is authorized by providing these settings alone.

The domain `bistrava.com` and `www.bistrava.com` are attached to the Bistrava Vercel project. Vercel verified both DNS configurations on 10 October 2026. HTTPS tests against the new Vercel address returned 200 for the apex and 308 from `www` to the apex; some local DNS caches still returned the former LWS web address. The LWS mail records were preserved. IMAP and SMTP authentication were subsequently verified on 17 October; optional Resend sender-domain verification and real-recipient delivery remain distinct.

## LWS inbox implementation (10 October 2026)

- `/admin/e-posta` displays the latest 100 imported incoming emails, text bodies and reply history. Older messages remain stored and are accessible from a notification link. IMAP imports INBOX forward in batches of 20; repeated syncs catch up with older mail. No mailbox messages are deleted or flagged remotely.
- `/admin/mailbox` requires active staff authorization for every request. Writes require a matching Origin. Credentials stay server-side. RLS permits only staff reads; writes use the guarded server route and service role.
- `MailboxSync` polls once per minute while an admin workspace tab is visible. A database lease with a 45-second throttle deduplicates tabs and instances. This is not an always-on background inbox service; mail arriving while the administration is closed is imported upon reopening it.
- Migration 020 stores messages, replies and cursor state. UIDVALIDITY + UID prevents duplicate imports. Each incoming message atomically creates an `email_events` notification with the same UUID. Opening message content marks the personal notification read. The separate event ledger excludes incoming records so simply opening the ledger does not acknowledge unread mail.
- Only plain text is rendered. Remote images and HTML are never rendered. MIME messages over 2 MB have envelope-only previews, and text bodies are capped at 100,000 characters. Attachments are listed, not downloaded; use LWS webmail for attachment access or full large messages.
- Replies go to the parsed Reply-To (or From) of an existing imported message. The browser cannot supply an arbitrary recipient. RFC Message-ID/In-Reply-To/References preserve threading. Replies are retained in Bistrava's history; they are not copied to LWS's Sent folder.
- A reply UUID is persisted before SMTP. Repeating that UUID does not resend. Pending/uncertain sends block additional replies to that message until investigated, including after process termination; never automatically retry SMTP after an ambiguous result. A database guard caps admin replies at 50/hour. `sent` means accepted by LWS SMTP, not proof of delivery to the recipient.
- The SMTP check authenticates only, sends zero messages, and persists its timestamp. Bank-transfer order instructions use LWS when its secret is configured. Inquiry notifications and the optional Resend order fallback require their own provider configuration.

The 17 October checks confirmed authenticated IMAP synchronization and SMTP authentication on the existing deployed runtime. Repeat those checks after any move to Render; a healthy `/health` response or successful container CI does not prove either connection. End-to-end message delivery still requires an explicitly approved test recipient. During migration, change only the required web DNS records and preserve the LWS MX, SPF, DKIM and DMARC records.
