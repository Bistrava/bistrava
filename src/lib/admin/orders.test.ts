import { describe, expect, it } from "vitest";

import { previewCustomerProfiles, previewOrders } from "@/lib/admin/orders";

describe("admin commerce preview", () => {
  it("uses only clearly fictional customer records", () => {
    expect(previewOrders).toHaveLength(4);
    expect(previewOrders.every((order) => order.email.endsWith("@example.com"))).toBe(true);
    expect(previewCustomerProfiles.every((profile) => profile.email?.endsWith("@example.com"))).toBe(true);
  });

  it("keeps order identifiers unique and totals tax-inclusive", () => {
    expect(new Set(previewOrders.map((order) => order.id)).size).toBe(previewOrders.length);
    expect(new Set(previewOrders.map((order) => order.reference)).size).toBe(previewOrders.length);
    for (const order of previewOrders) {
      expect(order.totalCents).toBe(
        order.subtotalCents - order.discountCents + order.shippingCents,
      );
    }
  });
});
