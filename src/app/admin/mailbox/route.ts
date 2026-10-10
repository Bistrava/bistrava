import { z } from 'zod';
import { getAdminAccess } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { mailboxAddress, mailboxConfigured, syncMailbox, verifyMailboxSmtp, sendMailboxReply } from '@/lib/email/mailbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control':'private, no-store', Vary:'Cookie', 'X-Robots-Tag':'noindex' };
const json = (data:unknown, status=200) => Response.json(data,{status,headers});
const fields = 'id,sender_name,sender_address,reply_address,subject,received_at,body_limited';

export async function GET(request:Request) {
  try {
    const access = await getAdminAccess();
    if (access.status !== 'authorized') return json({error:'unauthorized'},access.status==='forbidden'?403:401);
    const client = await createClient();
    if (!client) return json({error:'unavailable'},503);
    const url = new URL(request.url);
    if (url.searchParams.has('id')) {
      const id = z.uuid().safeParse(url.searchParams.get('id'));
      if (!id.success) return json({error:'invalid'},400);
      const [message,replies] = await Promise.all([
        client.from('mailbox_messages').select(`${fields},body_text,attachments`).eq('id',id.data).maybeSingle(),
        client.from('mailbox_replies').select('id,recipient,body_text,status,created_at').eq('message_id',id.data).order('created_at'),
      ]);
      if (message.error || replies.error) return json({error:'unavailable'},503);
      if (!message.data) return json({error:'not_found'},404);
      return json({...message.data,replies:replies.data});
    }
    const [messages,state] = await Promise.all([
      client.from('mailbox_messages').select(fields).order('received_at',{ascending:false}).limit(100),
      client.from('mailbox_sync').select('last_success_at,last_error,smtp_verified_at').eq('mailbox',mailboxAddress).single(),
    ]);
    if (messages.error || state.error) return json({error:'unavailable'},503);
    return json({messages:messages.data,state:state.data,configured:mailboxConfigured()});
  } catch { return json({error:'unavailable'},503); }
}

export async function POST(request:Request) {
  try {
    // This cookie-authenticated mutation is accepted only from its own origin.
    if (request.headers.get('origin') !== new URL(request.url).origin) return json({error:'origin'},403);
    const access = await getAdminAccess();
    if (access.status !== 'authorized') return json({error:'unauthorized'},access.status==='forbidden'?403:401);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error:'invalid'},400);
    if (Number(request.headers.get('content-length')) > 90000) return json({error:'too_large'},413);
    const raw = await request.text();
    if (raw.length > 90000) return json({error:'too_large'},413);
    let input;
    try { input = JSON.parse(raw); } catch { return json({error:'invalid'},400); }
    if (!mailboxConfigured()) return json({ok:false,reason:'not_configured'},503);
    if (input?.action === 'sync') return json(await syncMailbox());
    if (input?.action === 'verify') return json(await verifyMailboxSmtp());
    if (input?.action === 'reply') return json(await sendMailboxReply(input.reply,access.userId));
    return json({error:'invalid'},400);
  } catch { return json({error:'unavailable'},503); }
}
