import type Stripe from "stripe";

import { stripeHandledEvents } from "@/lib/payments/stripe-config";
import { applyStripeIntentEvent, getStripeClient, getStripeConfig } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const config = getStripeConfig();
  const stripe = getStripeClient();
  if (!config || !stripe) return new Response("Stripe is not configured.", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature.", { status: 400 });
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, config.webhookSecret);
  } catch {
    return new Response("Invalid signature.", { status: 400 });
  }

  if (!(stripeHandledEvents as readonly string[]).includes(event.type)) {
    return Response.json({ received: true, ignored: event.type });
  }

  try {
    const result = await applyStripeIntentEvent({
      eventId: event.id,
      eventType: event.type,
      intent: event.data.object as Stripe.PaymentIntent,
    });
    return Response.json({ received: true, status: result.status });
  } catch {
    // A 5xx makes Stripe retry the event later; the database call is idempotent per event id.
    return new Response("Event could not be recorded.", { status: 500 });
  }
}
