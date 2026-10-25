import "server-only";

import { Resend } from "resend";
import { render } from "react-email";
import { z } from "zod";
import { createHash, randomUUID } from 'node:crypto';
import { mailboxAddress, mailboxConfigured, smtpTransport } from './mailbox';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/commerce/money';

import OrderConfirmationEmail from "@/emails/order-confirmation";
import OrderStatusUpdateEmail from "@/emails/order-status-update";
import { orderStatusCopy } from "@/lib/email/order-status-copy";
import {
  emailRecipientSchema,
  orderConfirmationEmailSchema,
  orderStatusEmailSchema,
} from "@/lib/validation/email";

const emailConfigSchema = z.object({
  apiKey: z.string().startsWith("re_").min(10),
  from: z.string().min(3),
  replyTo: z.string().email(),
});

function getEmailConfig() {
  const result = emailConfigSchema.safeParse({
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO,
  });

  return result.success ? result.data : null;
}

// Sends from the LWS mailbox once per idempotency key; email_events records the outcome for staff.
async function sendThroughMailbox(input:{to:string;idempotencyKey:string;emailType:string;subject:string;text:string;html:string}) {
  const db=createAdminClient();
  if (!db) return {ok:false as const,reason:'not_configured' as const};
  const eventId=randomUUID();
  const messageId=`<${eventId}@bistrava.com>`;
  const reserved=await db.from('email_events').insert({id:eventId,email_type:input.emailType,recipient_hash:createHash('sha256').update(input.to).digest('hex'),
    idempotency_key:input.idempotencyKey,status:'queued',provider_message_id:messageId});
  if(reserved.error) {
    const previous=await db.from('email_events').select('status,provider_message_id').eq('idempotency_key',input.idempotencyKey).maybeSingle();
    return {ok:previous.data?.status==='sent',providerMessageId:previous.data?.provider_message_id};
  }
  const transport=smtpTransport();
  try {
    const sent=await transport.sendMail({from:{name:'Bistrava',address:mailboxAddress},to:input.to,replyTo:mailboxAddress,
      subject:input.subject,text:input.text,html:input.html,messageId});
    const ok=sent.accepted.length>0;
    await db.from('email_events').update({status:ok?'sent':'failed',error_code:ok?null:'smtp_rejected',occurred_at:new Date().toISOString()}).eq('id',eventId);
    return {ok,providerMessageId:messageId};
  } catch {
    await db.from('email_events').update({status:'failed',error_code:'smtp_delivery_unconfirmed',occurred_at:new Date().toISOString()}).eq('id',eventId);
    return {ok:false as const,reason:'provider_error' as const};
  } finally {transport.close();}
}

export async function sendOrderConfirmation(input: {
  to: string;
  idempotencyKey: string;
  data: unknown;
}) {
  const to = emailRecipientSchema.parse(input.to);
  const data = orderConfirmationEmailSchema.parse(input.data);
  const idempotencyKey = z.string().min(8).max(256).parse(input.idempotencyKey);
  if ((data.bankTransfer || data.cardPaid) && mailboxConfigured()) {
    const html = await render(OrderConfirmationEmail(data));
    const bank=data.bankTransfer;
    const itemLines=data.items.map(item=>`${item.quantity} × ${item.name}: ${formatMoney(item.lineTotalCents)}`);
    const text=(bank?[`Pozdravljeni, ${data.customerName}.`,'',`Prejeli smo naročilo ${data.orderReference}. Plačilo še ni prejeto.`,
      ...itemLines,'',
      `Končni znesek za nakazilo (z dostavo in upoštevanimi popusti): ${formatMoney(data.totalCents)}`,'',
      'NAVODILA ZA BANČNO NAKAZILO',`Prejemnik: ${bank.beneficiary}`,`IBAN: ${bank.iban}`,`Banka: ${bank.bankName}`,
      ...(bank.bic?[`BIC / SWIFT: ${bank.bic}`]:[]),'Valuta: EUR',`Namen / referenca: ${data.orderReference}`,'',
      'Nakazilo izvedite v svoji spletni ali mobilni banki. V namen plačila vpišite zgornjo referenco naročila.',
      `Po opravljenem nakazilu odgovorite na to e-sporočilo ali pišite na ${mailboxAddress} ter priložite potrdilo o nakazilu in navedite referenco ${data.orderReference}, da pospešimo obdelavo naročila.`,
      'Vaše naročilo bo dokončno potrjeno ob prejemu potrdila o nakazilu. Prejem sredstev preverimo ločeno. Če ste že plačali, ne nakazujte ponovno.',
      `Za pomoč odgovorite na to sporočilo ali pišite na ${mailboxAddress}.`]
      :[`Pozdravljeni, ${data.customerName}.`,'',`Prejeli smo naročilo ${data.orderReference} in plačilo s kartico je uspešno potrjeno.`,
      ...itemLines,'',`Plačano skupaj (z dostavo in upoštevanimi popusti): ${formatMoney(data.totalCents)}`,'',
      'Ko bo naročilo pripravljeno za odpremo, boste prejeli novo sporočilo.',`Naročilo: ${data.orderUrl}`,'',
      `Za pomoč odgovorite na to sporočilo ali pišite na ${mailboxAddress}.`]).join('\n');
    return sendThroughMailbox({to,idempotencyKey,emailType:bank?'order_bank_transfer':'order_card_paid',
      subject:bank?`Bistrava — navodila za plačilo ${data.orderReference}`:`Bistrava — potrditev plačila ${data.orderReference}`,text,html});
  }
  const config = getEmailConfig();
  if (!config) return { ok: false as const, reason: "not_configured" as const };
  const resend = new Resend(config.apiKey);

  const result = await resend.emails.send(
    {
      from: config.from,
      to: [to],
      replyTo: config.replyTo,
      subject: `Potrditev naročila ${data.orderReference}`,
      react: OrderConfirmationEmail(data),
    },
    { idempotencyKey },
  );

  if (result.error) {
    return { ok: false as const, reason: "provider_error" as const };
  }

  return { ok: true as const, providerMessageId: result.data?.id };
}

/** Branded e-mail sent to the customer when staff move an order to a new status. */
export async function sendOrderStatusEmail(input: { to: string; idempotencyKey: string; data: unknown }) {
  const to = emailRecipientSchema.parse(input.to);
  const data = orderStatusEmailSchema.parse(input.data);
  const idempotencyKey = z.string().min(8).max(256).parse(input.idempotencyKey);
  const copy = orderStatusCopy(data.status, data.orderReference);
  if (mailboxConfigured()) {
    const html = await render(OrderStatusUpdateEmail(data));
    const text = [`Pozdravljeni, ${data.customerName}.`, '', copy.intro, '',
      ...(data.status === 'shipped' && data.shipment ? [`Prevoznik: ${data.shipment.carrier}`, `Številka za sledenje: ${data.shipment.trackingNumber}`,
        ...(data.shipment.trackingUrl ? [`Sledenje: ${data.shipment.trackingUrl}`] : []), ''] : []),
      copy.next, '', ...data.items.map((item) => `${item.quantity} × ${item.name}: ${formatMoney(item.lineTotalCents)}`),
      `Skupaj: ${formatMoney(data.totalCents)}`, '', `Naročilo: ${data.orderUrl}`, '',
      `Za pomoč odgovorite na to sporočilo ali pišite na ${mailboxAddress}.`].join('\n');
    return sendThroughMailbox({ to, idempotencyKey, emailType: `order_status_${data.status}`, subject: copy.subject, text, html });
  }
  const config = getEmailConfig();
  if (!config) return { ok: false as const, reason: "not_configured" as const };
  const result = await new Resend(config.apiKey).emails.send(
    { from: config.from, to: [to], replyTo: config.replyTo, subject: copy.subject, react: OrderStatusUpdateEmail(data) },
    { idempotencyKey },
  );
  return result.error ? { ok: false as const, reason: "provider_error" as const } : { ok: true as const, providerMessageId: result.data?.id };
}
