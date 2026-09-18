import "server-only";

export type CheckoutMode = "manual_review";

export function getCheckoutConfig() {
  const mode = process.env.CHECKOUT_MODE;
  return {
    enabled: process.env.CHECKOUT_ORDERING_ENABLED === "true" && mode === "manual_review",
    mode: mode === "manual_review" ? (mode satisfies CheckoutMode) : null,
  };
}

