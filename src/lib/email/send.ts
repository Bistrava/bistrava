import "server-only";

import { Resend } from "resend";
import { render } from "react-email";
import { z } from "zod";
import { createHash, randomUUID } from 'node:crypto';
import { mailboxAddress, mailboxConfigured, smtpTransport } from './mailbox';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/commerce/money';

import OrderConfirmationEmail from "@/emails/order-confirmation";
import {
  emailRecipientSchema,
  orderConfirmationEmailSchema,
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

export async function sendOrderConfirmation(input: {
  to: string;
  idempotencyKey: string;
  data: unknown;
}) {
  const to = emailRecipientSchema.parse(input.to);
  const data = orderConfirmationEmailSchema.parse(input.data);
  const idempotencyKey = z.string().min(8).max(256).parse(input.idempotencyKey);
  if ((data.bankTransfer || data.cardPaid) && mailboxConfigured()) {
    const db=createAdminClient();
    if (!db) return {ok:false as const,reason:'not_configured' as const};
    const html = await render(OrderConfirmationEmail(data));
    const bank=data.bankTransfer;
    const eventId=randomUUID();
    const messageId=`<${eventId}@bistrava.com>`;
    const reserved=await db.from('email_events').insert({id:eventId,email_type:bank?'order_bank_transfer':'order_card_paid',recipient_hash:createHash('sha256').update(to).digest('hex'),
      idempotency_key:idempotencyKey,status:'queued',provider_message_id:messageId});
    if(reserved.error) {
      const previous=await db.from('email_events').select('status,provider_message_id').eq('idempotency_key',idempotencyKey).maybeSingle();
      return {ok:previous.data?.status==='sent',providerMessageId:previous.data?.provider_message_id};
    }
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
    const transport=smtpTransport();
    try {
      const sent=await transport.sendMail({from:{name:'Bistrava',address:mailboxAddress},to,replyTo:mailboxAddress,
        subject:bank?`Bistrava — navodila za plačilo ${data.orderReference}`:`Bistrava — potrditev plačila ${data.orderReference}`,text,html,messageId});
      const ok=sent.accepted.length>0;
      await db.from('email_events').update({status:ok?'sent':'failed',error_code:ok?null:'smtp_rejected',occurred_at:new Date().toISOString()}).eq('id',eventId);
      return {ok,providerMessageId:messageId};
    } catch {
      await db.from('email_events').update({status:'failed',error_code:'smtp_delivery_unconfirmed',occurred_at:new Date().toISOString()}).eq('id',eventId);
      return {ok:false as const,reason:'provider_error' as const};
    } finally {transport.close();}
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
