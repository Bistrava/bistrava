"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { headers } from "next/headers";

import { getCheckoutConfig } from "@/lib/commerce/config";
import { sendOrderConfirmation } from "@/lib/email/send";
import { hashGuestOrderToken, orderCookieName } from "@/lib/orders/guest-orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutFormSchema, checkoutQuoteSchema, type CheckoutQuoteState } from "@/lib/validation/checkout";

import type { CheckoutActionState } from "@/lib/forms/action-state";

type CheckoutRateEntry = { count: number; resetAt: number };
const checkoutGlobal = globalThis as typeof globalThis & {
  bistravaCheckoutRateStore?: Map<string, CheckoutRateEntry>;
};
const checkoutRateStore =
  checkoutGlobal.bistravaCheckoutRateStore ?? new Map<string, CheckoutRateEntry>();
checkoutGlobal.bistravaCheckoutRateStore = checkoutRateStore;

function isCheckoutRateLimited(key: string) {
  const now = Date.now();
  const current = checkoutRateStore.get(key);
  if (!current || current.resetAt <= now) {
    checkoutRateStore.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  if (current.count >= 5) return true;
  current.count += 1;
  return false;
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

  const checkoutConfig = getCheckoutConfig();
  if (!checkoutConfig.enabled) {
    return checkoutError(
      "Sprejem spletnih naročil še ni omogočen. Bistrava mora najprej potrditi način plačila in dostave.",
    );
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

  const { data, error } = await supabase.rpc("create_pending_guest_order", {
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
  });

  if (error || !Array.isArray(data) || !data[0]) {
    const detail = error?.message || "";
    if (detail.includes("checkout_total_changed")) return checkoutError("Končni znesek se je spremenil. Osvežite košarico in ponovno potrdite znesek pred oddajo.");
    if (detail.includes("discount_unavailable")) return checkoutError("Promocijska koda ni več veljavna za to naročilo. Odstranite jo ali ponovno preverite popust.");
    if (detail.includes("product_unavailable")) {
      return checkoutError("Cena ali zaloga enega od izdelkov se je spremenila. Osvežite košarico.");
    }
    if (detail.includes("shipping_rate_unavailable")) {
      return checkoutError("Izbrani način dostave ni več na voljo.");
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

  const { data: order } = await supabase
    .from("orders")
    .select("total_cents,order_items(product_name,quantity,line_total_cents)")
    .eq("id", orderId)
    .single();
  if (order && Array.isArray(order.order_items)) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await sendOrderConfirmation({
      to: parsed.data.email,
      idempotencyKey: `order-confirmation:${orderId}`,
      data: {
        customerName: `${parsed.data.firstName} ${parsed.data.lastName}`,
        orderReference: reference,
        orderUrl: new URL(`/narocilo/${reference}`, siteUrl).toString(),
        totalCents: Number(order.total_cents),
        items: order.order_items.map((item) => ({
          name: String(item.product_name),
          quantity: Number(item.quantity),
          lineTotalCents: Number(item.line_total_cents),
        })),
      },
    });
  }

  return {
    status: "success",
    message: "Naročilo je bilo varno ustvarjeno.",
    redirectUrl: `/narocilo/${reference}`,
  };
}
