"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { headers } from "next/headers";

import { getCardPaymentConfig, getCheckoutConfig } from "@/lib/commerce/config";
import { sendBankOrderNotification, sendOrderConfirmation } from "@/lib/email/send";
import { hashGuestOrderToken, orderCookieName } from "@/lib/orders/guest-orders";
import { createCardPaymentIntent } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutFormSchema, checkoutQuoteSchema, type CheckoutQuoteState } from "@/lib/validation/checkout";
import { isMemoryRateLimited, type RateLimitEntry } from "@/lib/security/rate-limit";

import type { CheckoutActionState } from "@/lib/forms/action-state";

const checkoutGlobal = globalThis as typeof globalThis & {
  bistravaCheckoutRateStore?: Map<string, RateLimitEntry>;
};
const checkoutRateStore =
  checkoutGlobal.bistravaCheckoutRateStore ?? new Map<string, RateLimitEntry>();
checkoutGlobal.bistravaCheckoutRateStore = checkoutRateStore;

function isCheckoutRateLimited(key: string) {
  return isMemoryRateLimited(checkoutRateStore, key, { limit: 5, windowMs: 15 * 60 * 1000 });
}

function checkoutError(message: string): CheckoutActionState {
  return { status: "error", message };
}

export async function quoteCheckout(input: unknown): Promise<CheckoutQuoteState> {
  const parsed = checkoutQuoteSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Preverite kodo, košarico in izbrano dostavo." };
  const requestHeaders = await headers();
  const clientKey = createHash("sha256").update(`quote:${process.env.RATE_LIMIT_SALT || "bistrava-local"}:${requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"}`).digest("hex");
  if (isCheckoutRateLimited(clientKey)) return { status: "error", message: "Preveč poskusov kode. Poskusite ponovno nekoliko pozneje." };
  const supabase = createAdminClient();
  if (!supabase) return { status: "error", message: "Popusta trenutno ni mogoče preveriti." };
  const { data, error } = await supabase.rpc("quote_guest_checkout", {
    input_cart_lines: parsed.data.cart,
    input_shipping_rate_id: parsed.data.shippingRateId,
    input_discount_code: parsed.data.discountCode || null,
  });
  if (error || !data) return { status: "error", message: error?.message.includes("product_unavailable")
    ? "Cena ali zaloga se je spremenila. Osvežite košarico."
    : error?.message.includes("shipping_rate_unavailable") ? "Izbrana dostava ni več na voljo."
    : "Kode za to naročilo ni mogoče uporabiti. Preverite veljavnost in pogoje promocije." };
  const quote = data as Record<string, unknown>;
  const amounts = [quote.subtotalCents, quote.shippingCents, quote.discountCents, quote.totalCents];
  if (!amounts.every((amount) => typeof amount === "number" && Number.isSafeInteger(amount) && amount >= 0)) {
    return { status: "error", message: "Popusta trenutno ni mogoče preveriti." };
  }
  return { status: "success", message: "Promocijska koda je upoštevana. Preglejte končni znesek.", quote: {
    subtotalCents: Number(quote.subtotalCents), shippingCents: Number(quote.shippingCents),
    discountCents: Number(quote.discountCents), totalCents: Number(quote.totalCents),
    code: typeof quote.code === "string" ? quote.code : null,
  } };
}

export async function createCheckoutOrder(
  _previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const parsed = checkoutFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Preverite označena polja in vsebino košarice.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  if (parsed.data.website) {
    return checkoutError("Naročila trenutno ni bilo mogoče oddati.");
  }

  const payByCard = formData.get("paymentMethod") === "card";
  const checkoutConfig = await getCheckoutConfig();
  if (payByCard) {
    if (!getCardPaymentConfig()) return checkoutError("Plačilo s kartico trenutno ni na voljo. Izberite drug način plačila.");
  } else {
    if ((formData.get('paymentSettingsVersion') || 'env') !== checkoutConfig.version) {
      return checkoutError('Podatki za plačilo so se spremenili. Osvežite stran in ponovno preverite naročilo.');
    }
    if (!checkoutConfig.enabled) {
      return checkoutError(
        "Oddaja naročila trenutno ni na voljo. Poskusite ponovno ali pišite na kontakt@bistrava.com.",
      );
    }
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = createHash("sha256")
    .update(`${process.env.RATE_LIMIT_SALT || "bistrava-local"}:${forwardedFor || "unknown"}`)
    .digest("hex");
  if (isCheckoutRateLimited(clientKey)) {
    return checkoutError("Preveč zaporednih poskusov. Poskusite ponovno nekoliko pozneje.");
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return checkoutError("Blagajna še ni povezana s podatkovno zbirko.");
  }

  const customer = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    company: parsed.data.company || null,
  };
  const shippingAddress = {
    addressLine1: parsed.data.addressLine1,
    addressLine2: parsed.data.addressLine2 || null,
    postalCode: parsed.data.postalCode,
    city: parsed.data.city,
    countryCode: parsed.data.countryCode,
  };

  const bankTransfer = !payByCard && checkoutConfig.mode === 'bank_transfer';
  const { data, error } = await supabase.rpc(payByCard ? "create_card_order" : bankTransfer ? 'create_bank_transfer_order' : "create_pending_guest_order", {
    input_cart_lines: parsed.data.cart,
    input_email: parsed.data.email,
    input_phone: parsed.data.phone,
    input_customer: customer,
    input_shipping_address: shippingAddress,
    input_shipping_rate_id: parsed.data.shippingRateId,
    input_customer_note: parsed.data.customerNote,
    input_guest_access_token_hash: hashGuestOrderToken(parsed.data.guestToken),
    input_idempotency_key: parsed.data.idempotencyKey,
    input_discount_code: parsed.data.discountCode || null,
    input_expected_total_cents: parsed.data.expectedTotalCents,
    ...(bankTransfer?{input_bank_details:checkoutConfig.bankTransfer}:{}),
  });

  if (error || !Array.isArray(data) || !data[0]) {
    const detail = error?.message || "";
    if (detail.includes('payment_settings_changed')) return checkoutError('Podatki za plačilo so se spremenili. Osvežite stran in ponovno preverite naročilo.');
    if (detail.includes("checkout_total_changed")) return checkoutError("Končni znesek se je spremenil. Osvežite košarico in ponovno potrdite znesek pred oddajo.");
    if (detail.includes("discount_unavailable")) return checkoutError("Promocijska koda ni več veljavna za to naročilo. Odstranite jo ali ponovno preverite popust.");
    if (detail.includes("product_unavailable")) {
      return checkoutError("Cena ali zaloga enega od izdelkov se je spremenila. Osvežite košarico.");
    }
    if (detail.includes("shipping_rate_unavailable")) {
      return checkoutError("Izbrani način dostave ni več na voljo.");
    }
    if (detail.includes("shipping_tax_allocation_requires_accountant_review")) {
      return checkoutError("Za ta v celoti znižani paket je potreben dodaten pregled dostave. Pišite na kontakt@bistrava.com; naročilo ni bilo ustvarjeno.");
    }
    return checkoutError("Naročila trenutno ni bilo mogoče varno shraniti. Poskusite znova.");
  }

  const orderId = String(data[0].order_id);
  const reference = String(data[0].order_reference);
  const cookieStore = await cookies();
  cookieStore.set(orderCookieName(reference), parsed.data.guestToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/narocilo/${reference}`,
    maxAge: 60 * 60 * 24 * 30,
  });

  if (payByCard) {
    // The order waits for Stripe; the confirmation e-mail is sent once the payment succeeds.
    try {
      const clientSecret = await createCardPaymentIntent(supabase, orderId);
      return { status: "success", message: "Naročilo je ustvarjeno. Potrdite plačilo s kartico.", redirectUrl: `/narocilo/${reference}`, clientSecret };
    } catch {
      return checkoutError("Plačila s kartico ni bilo mogoče začeti. Poskusite znova ali pišite na kontakt@bistrava.com.");
    }
  }

  const { data: order } = await supabase
    .from("orders")
    .select("email,phone,status,shipping_address_snapshot,total_cents,bank_transfer_snapshot,order_items(product_name,quantity,line_total_cents)")
    .eq("id", orderId)
    .single();
  if (order && Array.isArray(order.order_items)) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bistrava.com";
    // Email failure must never turn a successfully committed order into failure.
    const confirmation = {
      to: String(order.email),
      idempotencyKey: `order-confirmation:${orderId}`,
      data: {
        customerName: [order.shipping_address_snapshot?.firstName, order.shipping_address_snapshot?.lastName].filter(Boolean).join(" ") || "stranka",
        orderReference: reference,
        orderUrl: new URL(`/narocilo/${reference}`, siteUrl).toString(),
        totalCents: Number(order.total_cents),
        bankTransfer:order.bank_transfer_snapshot || undefined,
        items: order.order_items.map((item) => ({
          name: String(item.product_name),
          quantity: Number(item.quantity),
          lineTotalCents: Number(item.line_total_cents),
        })),
      },
    };
    const address = order.shipping_address_snapshot ?? {};
    await Promise.all([
      sendOrderConfirmation(confirmation).catch(() => ({ ok: false })),
      bankTransfer && order.status === 'awaiting_payment'
        ? sendBankOrderNotification({ orderId, data: {
          ...confirmation.data, bankTransfer: undefined,
          email: String(order.email), phone: String(order.phone ?? ''),
          address: [address.company, address.addressLine1, address.addressLine2, address.postalCode, address.city, address.countryCode].filter(Boolean).join(', '),
        } }).catch(() => ({ ok: false })) : Promise.resolve(null),
    ]);
  }

  return {
    status: "success",
    message: "Naročilo je bilo varno ustvarjeno.",
    redirectUrl: `/narocilo/${reference}`,
  };
}
