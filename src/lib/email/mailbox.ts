import 'server-only';

import { randomUUID } from 'node:crypto';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { createAdminClient } from '@/lib/supabase/admin';
import { cleanMailHeader, safeMailAddress, safeMessageId, mailboxReplySchema } from './mailbox-types';

export const mailboxAddress = 'kontakt@bistrava.com';
const host = 'mail60.lwspanel.com';
export const mailboxConfigured = () => Boolean(process.env.LWS_MAIL_PASSWORD);
function auth() {
  if (!process.env.LWS_MAIL_PASSWORD) throw new Error('mailbox_not_configured');
  return { user: mailboxAddress, pass: process.env.LWS_MAIL_PASSWORD };
}
function imapClient() {
  const client = new ImapFlow({
    host, port: 993, secure: true, auth: auth(), logger: false,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  });
  // Errors are deliberately not logged: provider errors can contain mail data.
  client.on('error', () => {});
  return client;
}
function smtpTransport() {
  return nodemailer.createTransport({
    host, port: 465, secure: true, auth: auth(),
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true,
  });
}

export async function syncMailbox() {
  if (!mailboxConfigured()) return { ok: false, reason: 'not_configured' };
  const db = createAdminClient();
  if (!db) return { ok: false, reason: 'database' };
  const lease = randomUUID();
  const claim = await db.rpc('claim_mailbox_sync', { input_lease: lease });
  if (claim.error) return { ok: false, reason: 'database' };
  if (!claim.data) return { ok: true, busy: true };
  const client = imapClient();
  const deadline = setTimeout(() => client.close(), 40000);
  let imported = 0;
  try {
    const state = await db.from('mailbox_sync').select('uid_validity,last_uid').eq('mailbox', mailboxAddress).single();
    if (state.error) throw new Error('state');
    await client.connect();
    const box = await client.mailboxOpen('INBOX', { readOnly: true });
    const validity = String(box.uidValidity);
    let cursor = state.data.uid_validity === validity ? Number(state.data.last_uid) : 0;
    const found = box.exists ? await client.search({ uid: `${cursor + 1}:*` }, { uid: true }) : [];
    const ids = (found || []).filter(uid => uid > cursor).sort((a,b) => a-b).slice(0,20);
    for (const uid of ids) {
      // Inspect size before fetching MIME, keeping serverless memory bounded.
      const metadata = await client.fetchOne(uid, { envelope: true, size: true, internalDate: true }, { uid: true });
      if (!metadata) { cursor = uid; continue; }
      let body = ''; let limited = (metadata.size ?? 0) > 2_000_000;
      let attachments: Array<{ name: string; size: number }> = [];
      if (!limited) {
        const source = await client.fetchOne(uid, { source: true }, { uid: true });
        if (!source || !source.source) throw new Error('source');
        const parsed = await simpleParser(source.source, { skipHtmlToText: false, skipTextToHtml: true, skipImageLinks: true, maxHtmlLengthToParse: 1_000_000 });
        body = (parsed.text || '').slice(0,100000);
        limited = (parsed.text?.length ?? 0) > 100000;
        attachments = parsed.attachments.map(a => ({ name: cleanMailHeader(a.filename || 'attachment', 200), size: a.size }));
      }
      const envelope = metadata.envelope;
      const sender = safeMailAddress(envelope?.from?.[0]?.address);
      const date = metadata.internalDate instanceof Date ? metadata.internalDate : new Date();
      const row = {
        mailbox: mailboxAddress, uid_validity: validity, imap_uid: uid,
        message_id: safeMessageId(envelope?.messageId) ?? null,
        sender_name: cleanMailHeader(envelope?.from?.[0]?.name || ''),
        sender_address: sender || '', reply_address: safeMailAddress(envelope?.replyTo?.[0]?.address) || sender,
        subject: cleanMailHeader(envelope?.subject || '(brez zadeve)', 500),
        body_text: body, body_limited: limited, attachments, received_at: date.toISOString(),
      };
      const saved = await db.from('mailbox_messages').upsert(row, { onConflict: 'mailbox,uid_validity,imap_uid', ignoreDuplicates: true });
      if (saved.error) throw new Error('save');
      cursor = uid; imported++;
      // Persist after each message; retries cannot skip a message or duplicate it.
      const updated = await db.from('mailbox_sync').update({ uid_validity: validity, last_uid: cursor }).eq('mailbox', mailboxAddress).eq('lease_id',lease);
      if (updated.error) throw new Error('cursor');
    }
    const finished = await db.from('mailbox_sync').update({
      uid_validity: validity, last_uid: cursor, last_success_at: new Date().toISOString(), last_error: null,
      lease_id: null, lease_until: null,
    }).eq('mailbox', mailboxAddress).eq('lease_id',lease);
    if (finished.error) throw new Error('finish');
    return { ok: true, imported, more: (found || []).filter(uid => uid > cursor).length > 0 };
  } catch {
    await db.from('mailbox_sync').update({ last_error: 'sync_failed', lease_id: null, lease_until: null }).eq('mailbox',mailboxAddress).eq('lease_id',lease);
    return { ok: false, reason: 'sync_failed' };
  } finally {
    clearTimeout(deadline);
    client.close();
  }
}

// Authentication check only. Does not send a message or modify mailbox flags.
export async function verifyMailboxSmtp() {
  const transport = smtpTransport();
  try {
    await transport.verify();
    const db = createAdminClient();
    const saved = await db?.from('mailbox_sync').update({ smtp_verified_at: new Date().toISOString() }).eq('mailbox',mailboxAddress);
    return { ok: Boolean(saved && !saved.error) };
  } catch { return { ok: false }; }
  finally { transport.close(); }
}

export async function sendMailboxReply(input: unknown, actorId: string) {
  const parsed = mailboxReplySchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: 'invalid' };
  const data = parsed.data;
  const db = createAdminClient();
  if (!db || !mailboxConfigured()) return { ok: false, reason: 'not_configured' };
  const original = await db.from('mailbox_messages').select('id,reply_address,sender_address,subject,message_id').eq('id',data.messageId).single();
  if (original.error) return { ok: false, reason: 'not_found' };
  const recipient = safeMailAddress(original.data.reply_address) || safeMailAddress(original.data.sender_address);
  if (!recipient || recipient.toLowerCase() === mailboxAddress) return { ok: false, reason: 'recipient' };
  const subject = cleanMailHeader(/^re:/i.test(original.data.subject) ? original.data.subject : `Re: ${original.data.subject}`);
  const rfcId = `<${data.id}@bistrava.com>`;
  const insert = await db.from('mailbox_replies').insert({ id:data.id, message_id:data.messageId, actor_id:actorId,
    recipient, subject, body_text:data.body, rfc_message_id:rfcId, status:'sending' });
  if (insert.error) {
    const existing = await db.from('mailbox_replies').select('message_id,body_text,status').eq('id',data.id).maybeSingle();
    if (existing.data?.message_id !== data.messageId || existing.data?.body_text !== data.body) return { ok:false, reason:'conflict' };
    return { ok:existing.data.status === 'sent', reason:existing.data.status };
  }
  // SMTP has no provider idempotency: never automatically retry an uncertain send.
  const transport = smtpTransport();
  let accepted = false;
  try {
    const response = await transport.sendMail({
      from: { name:'Bistrava', address:mailboxAddress }, to:recipient, replyTo:mailboxAddress,
      subject, text:data.body, messageId:rfcId,
      inReplyTo:safeMessageId(original.data.message_id), references:safeMessageId(original.data.message_id),
    });
    accepted = response.accepted.length > 0;
    const saved = await db.from('mailbox_replies').update({ status:accepted ? 'sent':'failed', sent_at:accepted ? new Date().toISOString():null }).eq('id',data.id);
    return { ok:accepted && !saved.error, reason:saved.error ? 'unknown' : accepted ? 'sent':'failed' };
  } catch {
    await db.from('mailbox_replies').update({ status:accepted ? 'sent':'unknown', sent_at:accepted ? new Date().toISOString():null }).eq('id',data.id);
    return { ok:false, reason:'unknown' };
  } finally { transport.close(); }
}
