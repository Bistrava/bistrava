"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { getStripePromise, paymentElementOptions } from "@/components/checkout/card-payment";
import { formatMoney } from "@/lib/commerce/money";

function PayForm({ amountCents, returnUrl }: { amountCents: number; returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setPending(true);
    setMessage("");
    const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl }, redirect: "if_required" });
    if (error) {
      setMessage(`${error.message || "Plačilo ni uspelo."} Poskusite znova z isto ali drugo kartico.`);
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <form className="pay-order-form" onSubmit={submit}>
      <PaymentElement options={paymentElementOptions} onReady={() => setReady(true)} />
      {!ready ? <p className="card-payment-loading" aria-live="polite">Varen plačilni obrazec se nalaga …</p> : null}
      <p className={message ? "form-status form-status-error" : "form-status"} aria-live="polite">{message}</p>
      <button className="button button-primary checkout-submit" disabled={!ready || pending} type="submit">
        <CreditCard aria-hidden="true" size={20} />
        {pending ? "Plačilo v teku …" : `Plačaj ${formatMoney(amountCents)}`}
      </button>
    </form>
  );
}

/** Pays an existing order's PaymentIntent; card data goes straight to Stripe. */
export function PayOrderForm({ publishableKey, clientSecret, amountCents, returnUrl }: {
  publishableKey: string;
  clientSecret: string;
  amountCents: number;
  returnUrl: string;
}) {
  return (
    <Elements
      stripe={getStripePromise(publishableKey)}
      options={{
        clientSecret,
        appearance: { theme: "stripe", variables: { colorPrimary: "#148f83", colorText: "#10324a", borderRadius: "8px", fontFamily: "Inter, Arial, sans-serif" } },
      }}
    >
      <PayForm amountCents={amountCents} returnUrl={returnUrl} />
    </Elements>
  );
}
