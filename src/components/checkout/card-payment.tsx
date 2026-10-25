"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
// The pure entry loads Stripe.js only when the card option is shown, not on every checkout visit.
import { loadStripe } from "@stripe/stripe-js/pure";
import { type RefObject, useEffect, useState } from "react";

export type CardPaymentApi = { stripe: Stripe; elements: StripeElements };

let stripePromise: ReturnType<typeof loadStripe> | null = null;
let stripePromiseKey = "";

function getStripePromise(publishableKey: string) {
  if (!stripePromise || stripePromiseKey !== publishableKey) {
    stripePromise = loadStripe(publishableKey, { locale: "sl" });
    stripePromiseKey = publishableKey;
  }
  return stripePromise;
}

// Exposes Stripe and Elements to the checkout form, which lives outside the Elements context.
type LoadState = "loading" | "ready" | "error";

function CardFields({ apiRef, onStateChange }: { apiRef: RefObject<CardPaymentApi | null>; onStateChange: (state: LoadState) => void }) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    apiRef.current = stripe && elements ? { stripe, elements } : null;
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, elements, stripe]);

  return (
    <PaymentElement
      options={{ layout: "tabs", wallets: { applePay: "never", googlePay: "never" } }}
      onReady={() => onStateChange("ready")}
      onLoadError={() => onStateChange("error")}
    />
  );
}

/** Card number, expiry date and security code are Stripe fields: card data goes straight to Stripe, never to Bistrava. */
export function CardPayment({ publishableKey, amountCents, apiRef }: {
  publishableKey: string;
  amountCents: number;
  apiRef: RefObject<CardPaymentApi | null>;
}) {
  const [loadState, setLoadState] = useState<LoadState>("loading");

  return (
    <div className="card-payment">
      <Elements
        stripe={getStripePromise(publishableKey)}
        options={{
          mode: "payment",
          amount: Math.max(amountCents, 50),
          currency: "eur",
          allowedPaymentMethodTypes: ["card"],
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "#148f83", colorText: "#10324a", borderRadius: "8px", fontFamily: "Inter, Arial, sans-serif" },
          },
        }}
      >
        <CardFields apiRef={apiRef} onStateChange={setLoadState} />
      </Elements>
      {loadState === "loading" ? <p className="card-payment-loading" aria-live="polite">Varen plačilni obrazec se nalaga …</p> : null}
      {loadState === "error" ? <p className="form-status form-status-error" role="alert">Plačilnega obrazca ni bilo mogoče naložiti. Osvežite stran ali pišite na kontakt@bistrava.com.</p> : null}
    </div>
  );
}
