import { z } from "zod";

// Actual card processing requires all three keys; checkout otherwise offers the unavailable-card flow.
const stripeConfigSchema = z.object({
  secretKey: z.string().regex(/^(sk|rk)_(test|live)_[A-Za-z0-9]{10,}$/),
  publishableKey: z.string().regex(/^pk_(test|live)_[A-Za-z0-9]{10,}$/),
  webhookSecret: z.string().regex(/^whsec_[A-Za-z0-9]{10,}$/),
}).refine((config) => config.secretKey.includes("_live_") === config.publishableKey.includes("_live_"), {
  message: "Stripe keys must belong to the same mode.",
});

export type StripeConfig = z.infer<typeof stripeConfigSchema>;

export function parseStripeConfig(env: Record<string, string | undefined>): StripeConfig | null {
  const result = stripeConfigSchema.safeParse({
    secretKey: env.STRIPE_SECRET_KEY?.trim(),
    publishableKey: env.STRIPE_PUBLISHABLE_KEY?.trim(),
    webhookSecret: env.STRIPE_WEBHOOK_SECRET?.trim(),
  });
  return result.success ? result.data : null;
}

export const stripePaymentIntentIdSchema = z.string().regex(/^pi_[A-Za-z0-9_]{6,250}$/);

// The Stripe states that change a Bistrava payment; others (processing, requires_action) wait for a later event.
export const stripeHandledEvents = ["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled"] as const;

export function stripeEventForIntentStatus(status: string) {
  return status === "succeeded" ? "payment_intent.succeeded"
    : status === "canceled" ? "payment_intent.canceled"
    : null;
}
