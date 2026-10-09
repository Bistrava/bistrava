import { describe, expect, it } from "vitest";
import { availableOrderStatuses, orderManagementSchema, shippingRateSchema, shippingZoneSchema, shipmentStatusesForOrder } from "@/lib/admin/order-management";
import { previewOrders } from "@/lib/admin/orders";

const pendingOrder = { ...previewOrders[1], status: "pending" as const };
const form = {
  orderId: "10000000-0000-4000-8000-000000000001", expectedUpdatedAt: "2026-10-08T12:00:00.000Z",
  status: "pending", internalNote: "Call before dispatch", editShipment: "yes", shipmentStatus: "pending",
  carrier: "", service: "", trackingNumber: "", trackingUrl: "", paymentReference: "",
};

describe("order management safety", () => {
  it("offers only the next fulfillment step and keeps terminal orders closed", () => {
    expect(availableOrderStatuses({ ...pendingOrder, status: "paid" })).toEqual(["paid", "processing"]);
    expect(availableOrderStatuses({ ...pendingOrder, status: "processing" })).toEqual(["processing", "shipped"]);
    expect(availableOrderStatuses({ ...pendingOrder, status: "cancelled" })).toEqual(["cancelled"]);
    expect(availableOrderStatuses({ ...pendingOrder, status: "completed" })).toEqual(["completed"]);
  });

  it("offers manual receipt confirmation only for pending manual payments", () => {
    expect(availableOrderStatuses(pendingOrder)).toContain("paid");
    expect(availableOrderStatuses({ ...pendingOrder, payment: null })).not.toContain("paid");
    expect(availableOrderStatuses({ ...pendingOrder, payment: { ...pendingOrder.payment!, provider: "stripe" } })).not.toContain("paid");
  });

  it("requires carrier and tracking for dispatch and consistent delivery status", () => {
    expect(orderManagementSchema.safeParse(form).success).toBe(true);
    expect(orderManagementSchema.safeParse({ ...form, status: "shipped", shipmentStatus: "shipped" }).success).toBe(false);
    expect(orderManagementSchema.safeParse({ ...form, status: "shipped", shipmentStatus: "shipped", carrier: "GLS", trackingNumber: "SI123" }).success).toBe(true);
    expect(orderManagementSchema.safeParse({ ...form, status: "completed", shipmentStatus: "in_transit", carrier: "GLS", trackingNumber: "SI123" }).success).toBe(false);
    expect(shipmentStatusesForOrder("completed")).toEqual(["delivered"]);
  });

  it("rejects executable tracking links and unconfirmed manual references", () => {
    expect(orderManagementSchema.safeParse({ ...form, trackingUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(orderManagementSchema.safeParse({ ...form, trackingUrl: "https://tracking.example/123" }).success).toBe(true);
    expect(orderManagementSchema.safeParse({ ...form, status: "paid", paymentReference: "BANK-123" }).success).toBe(false);
    expect(orderManagementSchema.safeParse({ ...form, status: "paid", paymentReference: "BANK-123", paymentReceived: "on" }).success).toBe(true);
  });
});

describe("shipping tariffs", () => {
  const rate = { id: "", expectedUpdatedAt: "", zoneId: form.orderId, name: "Standardna dostava", price: "5,90", estimatedDaysMin: "2", estimatedDaysMax: "4", active: "off" };
  it("accepts EUR cents and free shipping without floating point drift", () => {
    expect(shippingRateSchema.parse(rate).price).toBe(590);
    expect(shippingRateSchema.parse({ ...rate, price: "0" }).price).toBe(0);
    expect(shippingRateSchema.safeParse({ ...rate, price: "-2.00" }).success).toBe(false);
  });
  it("rejects impossible estimates and requires an edit version", () => {
    expect(shippingRateSchema.safeParse({ ...rate, estimatedDaysMin: "4", estimatedDaysMax: "2" }).success).toBe(false);
    expect(shippingRateSchema.safeParse({ ...rate, id: form.orderId }).success).toBe(false);
    expect(shippingZoneSchema.safeParse({ id: form.orderId, name: "Slovenija", active: "on", expectedUpdatedAt: "" }).success).toBe(false);
  });
  it("accepts inclusive basket boundaries in cents and optional unbounded sides", () => {
    expect(shippingRateSchema.parse({ ...rate, minOrder: "", maxOrder: "80,00" })).toMatchObject({ minOrder: null, maxOrder: 8000 });
    expect(shippingRateSchema.parse({ ...rate, price: "0", minOrder: "80.01", maxOrder: "" })).toMatchObject({ price: 0, minOrder: 8001, maxOrder: null });
    expect(shippingRateSchema.parse(rate)).toMatchObject({ minOrder: null, maxOrder: null });
    expect(shippingRateSchema.parse({ ...rate, minOrder: "0", maxOrder: "0" })).toMatchObject({ minOrder: 0, maxOrder: 0 });
  });
  it("rejects reversed, negative and fractional-cent basket ranges", () => {
    expect(shippingRateSchema.safeParse({ ...rate, minOrder: "80.01", maxOrder: "80.00" }).success).toBe(false);
    expect(shippingRateSchema.safeParse({ ...rate, minOrder: "-1" }).success).toBe(false);
    expect(shippingRateSchema.safeParse({ ...rate, maxOrder: "-0.01" }).success).toBe(false);
    expect(shippingRateSchema.safeParse({ ...rate, minOrder: "80.001" }).success).toBe(false);
  });
  it("allows unknown delivery estimates only when both are empty", () => {
    expect(shippingRateSchema.parse({ ...rate, estimatedDaysMin: "", estimatedDaysMax: "" })).toMatchObject({ estimatedDaysMin: null, estimatedDaysMax: null });
    expect(shippingRateSchema.parse({ ...rate, estimatedDaysMin: null, estimatedDaysMax: null })).toMatchObject({ estimatedDaysMin: null, estimatedDaysMax: null });
    expect(shippingRateSchema.safeParse({ ...rate, estimatedDaysMin: "", estimatedDaysMax: "3" }).success).toBe(false);
    expect(shippingRateSchema.safeParse({ ...rate, estimatedDaysMin: "3", estimatedDaysMax: "" }).success).toBe(false);
    expect(shippingRateSchema.safeParse({ ...rate, estimatedDaysMin: "0", estimatedDaysMax: "3" }).success).toBe(false);
    expect(shippingRateSchema.safeParse({ ...rate, estimatedDaysMax: "91" }).success).toBe(false);
    expect(shippingRateSchema.safeParse({ ...rate, estimatedDaysMin: "1.5" }).success).toBe(false);
  });
});
