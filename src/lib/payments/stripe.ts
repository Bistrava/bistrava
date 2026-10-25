import "server-only";

import Stripe from "stripe";

import { sendOrderConfirmation } from "@/lib/email/send";
import { parseStripeConfig, stripeEventForIntentStatus } from "@/lib/payments/stripe-config";
import { createAdminClient } from "@/lib/supabase/admin";

export function getStripeConfig() {
  return parseStripeConfig(process.env);
}

export function getStripeClient() {
  const config = getStripeConfig();
  return config ? new Stripe(config.secretKey) : null;
}

type Database = NonNullable<ReturnType<typeof createAdminClient>>;

/** Creates (or, on retry, returns) the order's PaymentIntent for the amount stored on the order. */
export async function createCardPaymentIntent(db: Database, orderId: string) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("stripe_not_configured");
  const { data: order, error } = await db.from("orders").select("reference,total_cents,checkout_mode,status").eq("id", orderId).single();
  if (error || !order || order.checkout_mode !== "card" || order.status !== "awaiting_payment") throw new Error("card_order_unavailable");
  const intent = await stripe.paymentIntents.create({
    amount: Number(order.total_cents),
    currency: "eur",
    allowed_payment_method_types: ["card"],
    description: `Bistrava ${order.reference}`,
    metadata: { order_id: orderId, order_reference: String(order.reference) },
  }, { idempotencyKey: `bistrava-order-${orderId}` });
  const attached = await db.rpc("attach_card_payment_intent", { input_order_id: orderId, input_intent_id: intent.id });
  if (attached.error) throw new Error(attached.error.message);
  if (!intent.client_secret) throw new Error("missing_client_secret");
  return intent.client_secret;
}

async function sendCardPaidEmail(db: Database, orderId: string) {
  const { data: order } = await db
    .from("orders")
    .select("reference,email,shipping_address_snapshot,total_cents,order_items(product_name,quantity,line_total_cents)")
    .eq("id", orderId)
    .single();
  if (!order || !Array.isArray(order.order_items)) return;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bistrava.com";
  await sendOrderConfirmation({
    to: String(order.email),
    idempotencyKey: `card-paid:${orderId}`,
    data: {
      customerName: [order.shipping_address_snapshot?.firstName, order.shipping_address_snapshot?.lastName].filter(Boolean).join(" ") || "stranka",
      orderReference: String(order.reference),
      orderUrl: new URL(`/narocilo/${order.reference}`, siteUrl).toString(),
      totalCents: Number(order.total_cents),
      cardPaid: true,
      items: order.order_items.map((item) => ({
        name: String(item.product_name),
        quantity: Number(item.quantity),
        lineTotalCents: Number(item.line_total_cents),
      })),
    },
  });
}

/** Records a verified PaymentIntent state once per event id and confirms the order by e-mail when it becomes paid. */
export async function applyStripeIntentEvent(input: { eventId: string; eventType: string; intent: Stripe.PaymentIntent }) {
  const db = createAdminClient();
  if (!db) throw new Error("database_unavailable");
  const { intent } = input;
  const { data, error } = await db.rpc("record_card_payment_event", {
    input_event_id: input.eventId,
    input_event_type: input.eventType,
    input_intent_id: intent.id,
    input_amount_cents: intent.amount,
    input_currency: intent.currency,
    // Only non-personal fields are kept; card details never leave Stripe.
    input_payload: { id: intent.id, status: intent.status, amount: intent.amount, currency: intent.currency, livemode: intent.livemode },
  });
  if (error) throw new Error(error.message);
  const result = data as { status: string; orderId?: string; newlyPaid?: boolean };
  if (result.newlyPaid && result.orderId) {
    // E-mail failure must not make Stripe retry an already recorded payment.
    await sendCardPaidEmail(db, result.orderId).catch(() => undefined);
  }
  return result;
}

/** Fallback for a delayed webhook: asks Stripe for the current PaymentIntent state. */
export async function syncCardPayment(intentId: string) {
  const stripe = getStripeClient();
  if (!stripe) return null;
  const intent = await stripe.paymentIntents.retrieve(intentId);
  const eventType = stripeEventForIntentStatus(intent.status);
  if (!eventType) return null;
  return applyStripeIntentEvent({ eventId: `sync:${intent.id}:${intent.status}`, eventType, intent });
}
