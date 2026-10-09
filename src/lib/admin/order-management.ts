import { z } from "zod";
import type { AdminOrder, AdminOrderStatus } from "@/lib/admin/orders";

export type AdminOrderActionState = { status: "idle" | "success" | "error"; message: string };
export const initialOrderActionState: AdminOrderActionState = { status: "idle", message: "" };

export function availableOrderStatuses(order: AdminOrder): AdminOrderStatus[] {
  const next: Partial<Record<AdminOrderStatus, AdminOrderStatus[]>> = {
    pending: ["awaiting_payment", "cancelled"],
    awaiting_payment: ["pending", "cancelled"],
    paid: ["processing"],
    processing: ["shipped"],
    shipped: ["completed"],
  };
  const statuses = next[order.status] ?? [];
  if (["pending", "awaiting_payment"].includes(order.status) && order.payment?.provider === "manual_review" && ["pending", "requires_action"].includes(order.payment.status)) {
    return [order.status, "paid", ...statuses];
  }
  return [order.status, ...statuses];
}

export function shipmentStatusesForOrder(status: AdminOrderStatus): string[] {
  if (status === "shipped") return ["shipped", "in_transit"];
  if (status === "completed") return ["delivered"];
  if (["cancelled", "refunded", "partially_refunded"].includes(status)) return [];
  return ["pending", "ready"];
}

const shortText = (length: number) => z.string().trim().max(length);
export const orderManagementSchema = z.object({
  orderId: z.string().uuid(),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  status: z.enum(["pending", "awaiting_payment", "paid", "processing", "shipped", "completed", "cancelled", "refunded", "partially_refunded"]),
  internalNote: shortText(5000),
  editShipment: z.enum(["yes", "no"]),
  shipmentStatus: z.enum(["pending", "ready", "shipped", "in_transit", "delivered"]),
  carrier: shortText(120),
  service: shortText(120),
  trackingNumber: shortText(200),
  trackingUrl: shortText(1000).refine((value) => {
    if (!value) return true;
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }),
  paymentReference: shortText(200),
  paymentReceived: z.string().optional(),
}).superRefine((value, context) => {
  if (value.paymentReference && (value.status !== "paid" || value.paymentReceived !== "on" || value.paymentReference.length < 3)) {
    context.addIssue({ code: "custom", path: ["paymentReference"], message: "Confirm received funds and enter the payment reference." });
  }
  if (value.editShipment === "yes" && value.status !== "cancelled") {
    if (!shipmentStatusesForOrder(value.status).includes(value.shipmentStatus)) {
      context.addIssue({ code: "custom", path: ["shipmentStatus"], message: "Shipment status must match the order." });
    }
    if (["shipped", "in_transit", "delivered"].includes(value.shipmentStatus) && (!value.carrier || !value.trackingNumber)) {
      context.addIssue({ code: "custom", path: ["trackingNumber"], message: "Carrier and tracking number are required." });
    }
  }
});

const optionalId = z.union([z.string().uuid(), z.literal("")]);
const optionalDate = z.union([z.string().datetime({ offset: true }), z.literal("")]);
export const shippingZoneSchema = z.object({
  id: optionalId,
  expectedUpdatedAt: optionalDate,
  name: shortText(120).min(2),
  active: z.enum(["on", "off"]),
}).refine((value) => !value.id || Boolean(value.expectedUpdatedAt));

const euroAmount = z.string().trim().regex(/^\d{1,5}([.,]\d{1,2})?$/).transform((value) => Math.round(Number(value.replace(",", ".")) * 100));
const optionalEuroAmount = z.union([z.literal(""), euroAmount]).optional().transform((value) => value === "" || value === undefined ? null : value);
const optionalDeliveryDays = z.preprocess((value) => value === null || value === undefined || (typeof value === "string" && value.trim() === "") ? null : value, z.coerce.number().int().min(1).max(90).nullable());

export const shippingRateSchema = z.object({
  id: optionalId,
  expectedUpdatedAt: optionalDate,
  zoneId: z.string().uuid(),
  name: shortText(120).min(2),
  price: euroAmount,
  minOrder: optionalEuroAmount,
  maxOrder: optionalEuroAmount,
  estimatedDaysMin: optionalDeliveryDays,
  estimatedDaysMax: optionalDeliveryDays,
  active: z.enum(["on", "off"]),
}).refine((value) => (value.estimatedDaysMin === null && value.estimatedDaysMax === null) || (value.estimatedDaysMin !== null && value.estimatedDaysMax !== null && value.estimatedDaysMax >= value.estimatedDaysMin), { path: ["estimatedDaysMax"], message: "Provide both delivery estimates in ascending order, or leave both empty." })
  .refine((value) => value.minOrder === null || value.maxOrder === null || value.maxOrder >= value.minOrder, { path: ["maxOrder"], message: "The maximum basket amount must be at least the minimum." })
  .refine((value) => !value.id || Boolean(value.expectedUpdatedAt));

export type AdminShippingZone = { id: string; name: string; active: boolean; updatedAt: string; countryCodes: string[] };
export type AdminShippingRate = { id: string; zoneId: string; name: string; active: boolean; updatedAt: string; priceCents: number; minOrderCents: number | null; maxOrderCents: number | null; estimatedDaysMin: number | null; estimatedDaysMax: number | null };
export type AdminShippingData = { source: "live" | "unavailable"; zones: AdminShippingZone[]; rates: AdminShippingRate[] };
