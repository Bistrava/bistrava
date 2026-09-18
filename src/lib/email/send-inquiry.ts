import "server-only";

import { Resend } from "resend";
import { z } from "zod";

import InquiryReceivedEmail from "@/emails/inquiry-received";

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

export async function sendInquiryNotifications(input: {
  requestId: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
}) {
  const config = getConfig();
  if (!config) return { ok: false as const, reason: "not_configured" as const };

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
}
