import "server-only";

import { Resend } from "resend";
import { z } from "zod";

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
  const config = getEmailConfig();
  if (!config) {
    return { ok: false as const, reason: "not_configured" as const };
  }

  const to = emailRecipientSchema.parse(input.to);
  const data = orderConfirmationEmailSchema.parse(input.data);
  const idempotencyKey = z.string().min(8).max(256).parse(input.idempotencyKey);
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
