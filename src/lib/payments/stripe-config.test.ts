import { describe, expect, it } from "vitest";

import { parseStripeConfig, stripeEventForIntentStatus, stripePaymentIntentIdSchema } from "@/lib/payments/stripe-config";

const testKeys = {
  STRIPE_SECRET_KEY: "sk_test_EXAMPLEONLY1234567890",
  STRIPE_PUBLISHABLE_KEY: "pk_test_EXAMPLEONLY1234567890",
  STRIPE_WEBHOOK_SECRET: "whsec_EXAMPLEONLY1234567890",
};

describe("Stripe configuration", () => {
  it("enables card payment only when all three keys are present and well-formed", () => {
    expect(parseStripeConfig(testKeys)).toEqual({
      secretKey: testKeys.STRIPE_SECRET_KEY,
      publishableKey: testKeys.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: testKeys.STRIPE_WEBHOOK_SECRET,
    });
    for (const missing of Object.keys(testKeys)) {
      expect(parseStripeConfig({ ...testKeys, [missing]: "" })).toBeNull();
    }
    expect(parseStripeConfig({ ...testKeys, STRIPE_SECRET_KEY: "pk_test_EXAMPLEONLY1234567890" })).toBeNull();
  });

  it("refuses a live secret key paired with a test publishable key", () => {
    expect(parseStripeConfig({ ...testKeys, STRIPE_SECRET_KEY: "sk_live_EXAMPLEONLY1234567890" })).toBeNull();
    expect(parseStripeConfig({ ...testKeys, STRIPE_SECRET_KEY: "rk_test_EXAMPLEONLY1234567890" })).not.toBeNull();
  });

  it("maps only final PaymentIntent states to payment events", () => {
    expect(stripeEventForIntentStatus("succeeded")).toBe("payment_intent.succeeded");
    expect(stripeEventForIntentStatus("canceled")).toBe("payment_intent.canceled");
    for (const status of ["processing", "requires_action", "requires_payment_method", "requires_confirmation"]) {
      expect(stripeEventForIntentStatus(status)).toBeNull();
    }
    expect(stripePaymentIntentIdSchema.safeParse("pi_3ExampleOnly").success).toBe(true);
    expect(stripePaymentIntentIdSchema.safeParse("ch_3ExampleOnly").success).toBe(false);
  });
});
