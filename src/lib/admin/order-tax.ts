import { z } from "zod";

import type { AdminOrder, AdminOrderItem } from "@/lib/admin/orders";

const cents = z.number().int().min(0).max(100_000_000);
const vatRate = z.number().min(0).max(100);

export type AdminOrderItemTaxSnapshot = {
  vatRate: number | null;
  lineTotalCents: number | null;
  discountCents: number | null;
  discountedLineTotalCents: number | null;
};

const shippingTaxSnapshotSchema = z.object({
  version: z.literal(1),
  method: z.literal("proportional_discounted_gross_by_vat_rate"),
  rounding: z.literal("half_up_cumulative_gross_then_half_up_tax_per_rate"),
  allocationBasis: z.enum(["discounted_products_gross", "no_shipping_charge", "single_rate_fully_discounted"]),
  shippingGrossCents: cents,
  shippingTaxCents: cents,
  shippingNetCents: cents,
  breakdown: z.array(z.object({
    vatRate,
    productsGrossCents: cents,
    shippingGrossCents: cents,
    shippingTaxCents: cents,
    shippingNetCents: cents,
  })).min(1).max(100),
});

export type AdminOrderShippingTaxSnapshot = z.infer<typeof shippingTaxSnapshotSchema>;

export type AdminOrderTaxGroup = { vatRate: number; netCents: number; taxCents: number; grossCents: number };

function storedCents(value: unknown): number | null {
  const parsed = cents.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Read only saved values. Missing historical discounts are never reconstructed. */
export function mapOrderItemTaxSnapshot(value: unknown): AdminOrderItemTaxSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const snapshot = value as Record<string, unknown>;
  const rate = vatRate.safeParse(snapshot.vatRate);
  const lineTotalCents = storedCents(snapshot.lineTotalCents);
  const discountCents = storedCents(snapshot.discountCents);
  const discountedLineTotalCents = storedCents(snapshot.discountedLineTotalCents);
  const hasSavedDiscount = lineTotalCents !== null && discountCents !== null
    && discountedLineTotalCents !== null && discountCents + discountedLineTotalCents === lineTotalCents;

  if (!rate.success && lineTotalCents === null) return null;
  return {
    vatRate: rate.success ? rate.data : null,
    lineTotalCents,
    discountCents: hasSavedDiscount ? discountCents : null,
    discountedLineTotalCents: hasSavedDiscount ? discountedLineTotalCents : null,
  };
}

/** Keep a recorded zero distinct from NULL, and reject inconsistent breakdowns. */
export function mapOrderShippingTax(row: {
  shipping_cents?: unknown;
  shipping_tax_cents?: unknown;
  shipping_tax_snapshot?: unknown;
}): { shippingTaxCents: number | null; shippingTaxSnapshot: AdminOrderShippingTaxSnapshot | null } {
  const shippingTaxCents = storedCents(row.shipping_tax_cents);
  const parsed = shippingTaxSnapshotSchema.safeParse(row.shipping_tax_snapshot);
  const result = { shippingTaxCents, shippingTaxSnapshot: null as AdminOrderShippingTaxSnapshot | null };
  if (!parsed.success) return result;

  const snapshot = parsed.data;
  if (snapshot.shippingGrossCents !== storedCents(row.shipping_cents)
    || snapshot.shippingTaxCents !== shippingTaxCents
    || snapshot.shippingNetCents + snapshot.shippingTaxCents !== snapshot.shippingGrossCents
    || snapshot.breakdown.some((part) => part.shippingNetCents + part.shippingTaxCents !== part.shippingGrossCents)
    || new Set(snapshot.breakdown.map((part) => part.vatRate)).size !== snapshot.breakdown.length
    || snapshot.breakdown.reduce((sum, part) => sum + part.shippingGrossCents, 0) !== snapshot.shippingGrossCents
    || snapshot.breakdown.reduce((sum, part) => sum + part.shippingTaxCents, 0) !== snapshot.shippingTaxCents) {
    return result;
  }
  return { shippingTaxCents, shippingTaxSnapshot: snapshot };
}

export function orderItemNetCents(item: Pick<AdminOrderItem, "taxSnapshot" | "taxCents">): number | null {
  const gross = storedCents(item.taxSnapshot?.discountedLineTotalCents);
  const tax = storedCents(item.taxCents);
  return gross !== null && tax !== null && tax <= gross ? gross - tax : null;
}

/** Group only a complete, reconciled saved order; never recalculate VAT. */
export function orderTaxGroups(order: Pick<AdminOrder, "items" | "subtotalCents" | "discountCents" | "shippingCents" | "shippingTaxCents" | "shippingTaxSnapshot" | "taxCents" | "totalCents">): AdminOrderTaxGroup[] | null {
  const shipping = mapOrderShippingTax({ shipping_cents: order.shippingCents, shipping_tax_cents: order.shippingTaxCents, shipping_tax_snapshot: order.shippingTaxSnapshot }).shippingTaxSnapshot;
  if (!shipping || order.items.length === 0) return null;

  const groups = new Map<number, AdminOrderTaxGroup>();
  let subtotal = 0;
  let discount = 0;
  for (const item of order.items) {
    const saved = item.taxSnapshot;
    const net = orderItemNetCents(item);
    if (!saved || saved.vatRate === null || !vatRate.safeParse(saved.vatRate).success
      || storedCents(saved.lineTotalCents) === null || storedCents(saved.discountCents) === null
      || storedCents(saved.discountedLineTotalCents) === null || net === null
      || saved.lineTotalCents !== item.lineTotalCents
      || saved.discountCents! + saved.discountedLineTotalCents! !== saved.lineTotalCents) return null;

    subtotal += saved.lineTotalCents!;
    discount += saved.discountCents!;
    const group = groups.get(saved.vatRate) ?? { vatRate: saved.vatRate, netCents: 0, taxCents: 0, grossCents: 0 };
    group.netCents += net;
    group.taxCents += item.taxCents;
    group.grossCents += saved.discountedLineTotalCents!;
    groups.set(saved.vatRate, group);
  }

  // The saved shipping allocation must use exactly these discounted product bases.
  if (shipping.breakdown.length !== groups.size) return null;
  for (const part of shipping.breakdown) {
    const group = groups.get(part.vatRate);
    if (!group || group.grossCents !== part.productsGrossCents) return null;
    group.netCents += part.shippingNetCents;
    group.taxCents += part.shippingTaxCents;
    group.grossCents += part.shippingGrossCents;
  }
  const result = Array.from(groups.values()).sort((a, b) => a.vatRate - b.vatRate);
  if (subtotal !== order.subtotalCents || discount !== order.discountCents
    || result.reduce((sum, group) => sum + group.grossCents, 0) !== order.totalCents
    || result.reduce((sum, group) => sum + group.taxCents, 0) !== order.taxCents) return null;
  return result;
}
