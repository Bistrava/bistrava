"use server";

import { quoteCheckout } from "@/actions/checkout";
import { getCardPaymentConfig, getCheckoutConfig } from "@/lib/commerce/config";
import { sendCardAttemptNotification } from "@/lib/email/send";
import type { CheckoutActionState } from "@/lib/forms/action-state";
import { cardUnavailableMessage } from "@/lib/payments/card-unavailable";
import { checkoutFormSchema } from "@/lib/validation/checkout";

/** Records a choice of unavailable card payment, never creates an order or a payment. */
export async function notifyCardAttempt(formData: FormData): Promise<CheckoutActionState> {
  const unavailable: CheckoutActionState = { status: "error", message: cardUnavailableMessage };
  const parsed = checkoutFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {
    status: "error", message: "Preverite označena polja in vsebino košarice.",
    fieldErrors: parsed.error.flatten().fieldErrors,
  };
  try {
    const config = await getCheckoutConfig();
    if (getCardPaymentConfig()) return { status: "error", message: "Načini plačila so se spremenili. Osvežite stran." };
    if (!config.enabled) return unavailable;
    // Reuse the rate-limited, read-only server quote. Never trust browser totals.
    const result = await quoteCheckout(parsed.data);
    if (result.status !== "success" || !result.quote) return unavailable;
    await sendCardAttemptNotification({ data: parsed.data, quote: result.quote });
  } catch {
    // Mail/database failure must not prevent the customer from choosing bank transfer.
    // Do not log the request or expose provider details to the customer.
  }
  return unavailable;
}
