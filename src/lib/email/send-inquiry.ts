import "server-only";

import { Resend } from "resend";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";

import InquiryReceivedEmail from "@/emails/inquiry-received";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailRecipientSchema } from "@/lib/validation/email";
import { cleanMailHeader } from "./mailbox-types";
import { mailboxAddress, mailboxConfigured, smtpTransport } from "./mailbox";

const configSchema = z.object({
  apiKey: z.string().startsWith("re_").min(10),
  from: z.string().min(3),
  replyTo: z.string().email(),
  internalTo: z.string().email(),
});

function getConfig() {
  const result = configSchema.safeParse({
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO,
    internalTo: process.env.EMAIL_INTERNAL_TO,
  });
  return result.success ? result.data : null;
}

type InquiryNotification = {
  requestId: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
};

const inquiryNotificationSchema = z.object({
  requestId: z.uuid(), type: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120), email: emailRecipientSchema,
  phone: z.string().max(40).nullable(), message: z.string().trim().min(1).max(4000),
});

type MailNotice = { to: string; replyTo: string; subject: string; text: string; key: string; emailType: string };

async function sendLwsNotice(db: NonNullable<ReturnType<typeof createAdminClient>>, notice: MailNotice) {
  const recipientHash = createHash("sha256").update(notice.to).digest("hex");
  const eventId = randomUUID();
  const messageId = `<${eventId}@bistrava.com>`;
  let transport: ReturnType<typeof smtpTransport> | undefined;
  let reserved = false;
  try {
    const reservation = await db.from("email_events").insert({
      id: eventId, email_type: notice.emailType, recipient_hash: recipientHash,
      idempotency_key: notice.key, status: "queued", provider_message_id: messageId,
    });
    if (reservation.error) {
      if (reservation.error.code !== "23505") return { ok: false };
      const previous = await db.from("email_events").select("status,provider_message_id,recipient_hash,email_type")
        .eq("idempotency_key", notice.key).maybeSingle();
      const event = previous.data;
      if (previous.error || !event || event.recipient_hash !== recipientHash || event.email_type !== notice.emailType) return { ok: false };
      // SMTP cannot guarantee idempotent delivery. A queued/failed outcome is
      // reserved permanently for staff review, never automatically retried.
      const sent = event.status === "sent" || event.status === "delivered";
      return { ok: sent, id: sent && typeof event.provider_message_id === "string" ? event.provider_message_id : undefined };
    }
    reserved = true;
    transport = smtpTransport();
    const sent = await transport.sendMail({
      from: { name: "Bistrava", address: mailboxAddress }, to: notice.to, replyTo: notice.replyTo,
      subject: notice.subject, text: notice.text, messageId,
    });
    const accepted = sent.accepted.length > 0;
    const saved = await db.from("email_events").update({
      status: accepted ? "sent" : "failed", error_code: accepted ? null : "smtp_rejected",
      occurred_at: new Date().toISOString(),
    }).eq("id", eventId);
    return { ok: accepted && !saved.error, id: accepted ? messageId : undefined };
  } catch {
    if (reserved) {
      try {
        await db.from("email_events").update({
          status: "failed", error_code: "smtp_delivery_unconfirmed", occurred_at: new Date().toISOString(),
        }).eq("id", eventId);
      } catch { /* Keep the queued reservation when the database is unavailable. */ }
    }
    return { ok: false };
  } finally {
    try { transport?.close(); } catch { /* A cleanup error must not discard the saved inquiry. */ }
  }
}

async function sendLwsInquiryNotifications(input: InquiryNotification) {
  const parsed = inquiryNotificationSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid" as const };
  const data = parsed.data;
  const db = createAdminClient();
  if (!db) return { ok: false as const, reason: "not_configured" as const };

  const acknowledgement = await sendLwsNotice(db, {
    key: `inquiry-ack-${data.requestId}`, emailType: "inquiry_acknowledgement",
    to: data.email, replyTo: mailboxAddress,
    subject: `Bistrava - kopija povpraševanja ${data.requestId}`,
    text: [
      `Pozdravljeni, ${data.name}.`, "", `Vaše povpraševanje ${data.requestId} je varno shranjeno.`,
      "", "Kopija vašega sporočila:", data.message, "", "Za pomoč odgovorite na to sporočilo.",
    ].join("\n"),
  });
  // Failure of one recipient must not suppress the other independent notice.
  const internal = await sendLwsNotice(db, {
    key: `inquiry-internal-${data.requestId}`, emailType: "inquiry_internal",
    to: mailboxAddress, replyTo: data.email,
    subject: cleanMailHeader(`Novo povpraševanje Bistrava - ${data.type}`),
    text: [
      `Referenca: ${data.requestId}`, `Vrsta: ${data.type}`, `Ime: ${data.name}`,
      `E-pošta: ${data.email}`, `Telefon: ${data.phone || "ni naveden"}`, "", data.message,
    ].join("\n"),
  });
  return {
    ok: acknowledgement.ok && internal.ok,
    acknowledgementId: acknowledgement.id, internalId: internal.id,
  };
}

export async function sendInquiryNotifications(input: InquiryNotification) {
  if (mailboxConfigured()) {
    try { return await sendLwsInquiryNotifications(input); }
    catch { return { ok: false as const, reason: "provider_error" as const }; }
  }
  const config = getConfig();
  if (!config) return { ok: false as const, reason: "not_configured" as const };

  try {
    const resend = new Resend(config.apiKey);
    const acknowledgement = await resend.emails.send(
      {
        from: config.from,
        to: [input.email],
        replyTo: config.replyTo,
        subject: `Bistrava - kopija povpraševanja ${input.requestId}`,
        react: InquiryReceivedEmail({
          name: input.name,
          requestId: input.requestId,
          message: input.message,
        }),
      },
      { idempotencyKey: `inquiry-ack-${input.requestId}` },
    );

    const internal = await resend.emails.send(
      {
        from: config.from,
        to: [config.internalTo],
        replyTo: input.email,
        subject: `Novo povpraševanje Bistrava - ${input.type}`,
        text: [
          `Referenca: ${input.requestId}`,
          `Vrsta: ${input.type}`,
          `Ime: ${input.name}`,
          `E-pošta: ${input.email}`,
          `Telefon: ${input.phone || "ni naveden"}`,
          "",
          input.message,
        ].join("\n"),
      },
      { idempotencyKey: `inquiry-internal-${input.requestId}` },
    );

    return {
      ok: !acknowledgement.error && !internal.error,
      acknowledgementId: acknowledgement.data?.id,
      internalId: internal.data?.id,
    };
  } catch { return { ok: false as const, reason: "provider_error" as const }; }
}
