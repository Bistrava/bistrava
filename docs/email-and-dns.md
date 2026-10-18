# Email and DNS

## Current state (18 October 2026)

The confirmed Bistrava mailbox is `kontakt@bistrava.com` on LWS. On 17 October, the deployed administration reported a successful IMAP synchronization and SMTP authentication. The SMTP check performs a handshake only and sends no message. No mailbox contents or credentials were copied for this check. End-to-end delivery to a real recipient has not been verified and still requires an explicitly authorized test recipient.

Bank-transfer order instructions use authenticated LWS SMTP when `LWS_MAIL_PASSWORD` is configured. The receiving account was saved by the owner as a disabled draft in `/admin/placila`; its values were not copied into the repository. Ordering remains closed. A committed bank-transfer order would be `awaiting_payment`, with a pending payment until staff confirm receipt of funds; SMTP acceptance does not establish payment or recipient delivery.

On `codex/finalisation-render`, `src/lib/email/send-inquiry.ts` now prefers authenticated LWS SMTP when `LWS_MAIL_PASSWORD` is configured. After an inquiry is stored in Supabase, it sends a customer acknowledgement and an independent internal notification to `kontakt@bistrava.com`. Each LWS notice reserves its own `email_events` entry and idempotency key before SMTP; failure of either notice does not suppress the other. A queued or failed reservation is retained for staff review rather than automatically retried. These code paths have not been verified by sending a real email on Render.

The LWS inquiry path uses the configured mailbox identity and does not require `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` or `EMAIL_INTERNAL_TO`. If LWS is absent, the existing Resend path remains available with those four settings and a verified sender. `src/emails/inquiry-received.tsx` remains its acknowledgement template. Resend is also the optional order-email fallback when LWS is unconfigured; successful LWS authentication does not activate Resend. The administration email-status indicator in this change also recognizes LWS configuration.

The application batch on `codex/finalisation-render`, reference `fc13`, is published in [draft PR #1](https://github.com/Bistrava/bistrava/pull/1); its 57 changed files were audited exactly. This documentation update follows that application audit. The [successful Linux CI run for `e08`](https://github.com/Bistrava/bistrava/actions/runs/39084962778) passed 182 unit tests, Docker/smoke checks and a real connected local-Supabase scenario with synthetic data: order A cancellation/restocking, and order B recorded payment, processing and shipment. Email transport was disabled, so these tests do not prove recipient delivery. No production credentials or production orders were used. The [CI run for `fc13`](https://github.com/Bistrava/bistrava/actions/runs/39085311797) is also Success with both jobs passed, and its Vercel Preview is Ready (`DnLC2ALeHxJpj7nHfrQ2CC9QBqoP`). A previous Ready [Vercel contact preview](https://bistrava-git-codex-finalisation-render-bistrava.vercel.app/kontakt), from `c0ef8d0`, was checked read-only for public seller/return details.

Render service `srv-dba1njrrjlhs738imm4g` has been created with the assigned URL `https://bistrava.onrender.com`, Docker in Frankfurt, the approved `0.5c-512mb` plan at $7/month, `/health`, port `10000` and automatic deployment disabled. The owner entered the card directly, Render confirmed the paid service and prorated billing has started. The initial Render HTTP smoke passed health, public pages, seller details, images, noindex and origin protection without Supabase/LWS, orders or emails. Deployment `dep-dba1pfeq1p3s73a05g2g` is now Live with the canonical URL and `og:url` verified against the Render origin. `RATE_LIMIT_SALT` was generated in the UI without copying its value. Ordering and indexing remain disabled.

With the owner's explicit authorization, the public Supabase URL and key were copied from Vercel Production to Render. The Vercel server key is Sensitive and cannot be revealed, so an existing server key was retrieved from the Supabase API Keys UI and transferred to Render instead; no key was created or rotated. The public and server configuration is now present in Render, and no values were written into the repository. The HTTP smoke and real-catalogue read have passed. Render displays all 24 real products, including Cintropur at €125.90 with stock 15. With one item in the cart, checkout shows “Sprejem naročil še ni aktiviran” and its submit button is disabled. No form was filled or submitted, and the cart was emptied afterwards. These checks do not prove SMTP operation or recipient delivery.

The LWS password is also Sensitive in Vercel and has not been transferred. The blank `LWS_MAIL_PASSWORD` field in the Render edit form is prepared for the owner to enter and save the password directly. After its deployment, repeat IMAP/SMTP authentication from that runtime before a separately authorized recipient-delivery test. No production order was submitted and no email was sent on Render. `main`, the production website and DNS records remain unchanged. See [Render state](hosting-render.md) and [launch readiness](launch-readiness.md).

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

The LWS inquiry implementation reserves separate `inquiry_acknowledgement` and `inquiry_internal` events with hashed recipients. It records SMTP acceptance as `sent`, or retains a queued/failed reservation when the outcome is uncertain. This prevents automatic duplicate sends; SMTP acceptance alone is not proof of recipient delivery. Thirteen mocked regression tests cover LWS without Resend, partial failures, uncertain delivery, duplicate prevention and the Resend fallback. All 195 application tests, TypeScript and lint pass locally. Deployment and real-recipient delivery remain separate checks.

A future signed Resend webhook will record delivered, bounced, complained, suppressed, and failed events in `email_events`. Recipient addresses must be hashed in the operational ledger. Webhook authenticity must be verified before any status is trusted.

## Integration history

### 9 October 2026

The Messages page subscribes to `quote_requests` and the email ledger subscribes to `email_events`. Migration `202610090018` adds both tables to `supabase_realtime` while preserving staff-only reads and removing browser insertion into the email ledger. The UI pauses refreshes while notes are being edited and falls back to polling every 30 seconds while visible.

At that stage, no Resend integration was attached to the Bistrava Vercel project, and the production settings inspected had no `RESEND_API_KEY`, `EMAIL_FROM`, or `EMAIL_REPLY_TO`. The event ledger was not an incoming mailbox and no direct reply composer or inbound email webhook was enabled. The LWS implementation below supersedes that inbox/reply status; the current LWS inquiry path is described above.

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
- The SMTP check authenticates only, sends zero messages, and persists its timestamp. Bank-transfer order instructions and inquiry notifications use LWS when its secret is configured; the Resend inquiry and order fallbacks retain their separate provider settings.

The 17 October checks confirmed authenticated IMAP synchronization and SMTP authentication on the existing deployed runtime. Repeat those checks after any move to Render; a healthy `/health` response or successful container CI does not prove either connection. End-to-end message delivery still requires an explicitly approved test recipient. During migration, change only the required web DNS records and preserve the LWS MX, SPF, DKIM and DMARC records.
