import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";

export type GuestOrder = {
  reference: string;
  status: string;
  email: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  shippingAddress: Record<string, unknown>;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};

export function orderCookieName(reference: string) {
  return `bistrava-order-${reference.toLowerCase()}`;
}

export function hashGuestOrderToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getGuestOrder(reference: string): Promise<GuestOrder | null> {
  if (!/^BIS-[A-Z0-9-]{8,32}$/.test(reference)) return null;
  const token = (await cookies()).get(orderCookieName(reference))?.value;
  if (!token) return null;
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(
      "reference,status,email,subtotal_cents,shipping_cents,total_cents,shipping_address_snapshot,created_at,order_items(product_name,sku,quantity,unit_price_cents,line_total_cents)",
    )
    .eq("reference", reference)
    .eq("guest_access_token_hash", hashGuestOrderToken(token))
    .maybeSingle();

  if (error || !data) return null;
  const address = data.shipping_address_snapshot;
  return {
    reference: String(data.reference),
    status: String(data.status),
    email: String(data.email),
    subtotalCents: Number(data.subtotal_cents),
    shippingCents: Number(data.shipping_cents),
    totalCents: Number(data.total_cents),
    createdAt: String(data.created_at),
    shippingAddress:
      address && typeof address === "object" && !Array.isArray(address)
        ? (address as Record<string, unknown>)
        : {},
    items: Array.isArray(data.order_items)
      ? data.order_items.map((item) => ({
          name: String(item.product_name),
          sku: String(item.sku),
          quantity: Number(item.quantity),
          unitPriceCents: Number(item.unit_price_cents),
          lineTotalCents: Number(item.line_total_cents),
        }))
      : [],
  };
}

