import { describe, expect, it } from "vitest";

import { mapOrderItemTaxSnapshot, mapOrderShippingTax, orderItemNetCents, orderTaxGroups } from "@/lib/admin/order-tax";
import { previewOrders } from "@/lib/admin/orders";

const shippingSnapshot = {
  version: 1,
  method: "proportional_discounted_gross_by_vat_rate",
  rounding: "half_up_cumulative_gross_then_half_up_tax_per_rate",
  allocationBasis: "discounted_products_gross",
  shippingGrossCents: 1000,
  shippingTaxCents: 171,
  shippingNetCents: 829,
  breakdown: [
    { vatRate: 9.5, productsGrossCents: 1000, shippingGrossCents: 100, shippingTaxCents: 9, shippingNetCents: 91 },
    { vatRate: 22, productsGrossCents: 9000, shippingGrossCents: 900, shippingTaxCents: 162, shippingNetCents: 738 },
  ],
};
const shippingRow = { shipping_cents: 1000, shipping_tax_cents: 171, shipping_tax_snapshot: shippingSnapshot };

describe("saved order item tax data", () => {
  it("reads the original rate and discount amounts without using current catalogue data", () => {
    expect(mapOrderItemTaxSnapshot({ vatRate: 9.5, lineTotalCents: 1234, discountCents: 234, discountedLineTotalCents: 1000, unused: "not sent to browser" }))
      .toEqual({ vatRate: 9.5, lineTotalCents: 1234, discountCents: 234, discountedLineTotalCents: 1000 });
  });

  it("does not invent a zero discount or discounted total for an older snapshot", () => {
    expect(mapOrderItemTaxSnapshot({ vatRate: 22, lineTotalCents: 101 }))
      .toEqual({ vatRate: 22, lineTotalCents: 101, discountCents: null, discountedLineTotalCents: null });
    expect(mapOrderItemTaxSnapshot(null)).toBeNull();
    expect(mapOrderItemTaxSnapshot({})).toBeNull();
  });

  it("preserves explicit zero values, including a fully discounted line", () => {
    expect(mapOrderItemTaxSnapshot({ vatRate: 0, lineTotalCents: 100, discountCents: 100, discountedLineTotalCents: 0 }))
      .toEqual({ vatRate: 0, lineTotalCents: 100, discountCents: 100, discountedLineTotalCents: 0 });
    expect(mapOrderItemTaxSnapshot({ vatRate: 22, lineTotalCents: 100, discountCents: 0, discountedLineTotalCents: 100 })?.discountCents).toBe(0);
  });

  it("keeps malformed rates and inconsistent discounts unavailable instead of coercing them", () => {
    expect(mapOrderItemTaxSnapshot({ vatRate: "22", lineTotalCents: 100, discountCents: 1, discountedLineTotalCents: 100 }))
      .toEqual({ vatRate: null, lineTotalCents: 100, discountCents: null, discountedLineTotalCents: null });
    expect(mapOrderItemTaxSnapshot({ vatRate: 22, lineTotalCents: 100, discountCents: -1, discountedLineTotalCents: 101 })?.discountCents).toBeNull();
  });
});

describe("saved shipping tax data", () => {
  it("preserves the saved mixed-rate breakdown and its exact cents", () => {
    expect(mapOrderShippingTax(shippingRow)).toEqual({ shippingTaxCents: 171, shippingTaxSnapshot: shippingSnapshot });
    expect(shippingRow.shipping_cents).toBe(1000);
  });

  it("keeps historical NULL unknown even when delivery was free", () => {
    expect(mapOrderShippingTax({ shipping_cents: 0, shipping_tax_cents: null, shipping_tax_snapshot: null }))
      .toEqual({ shippingTaxCents: null, shippingTaxSnapshot: null });
    expect(mapOrderShippingTax({ shipping_cents: 590 })).toEqual({ shippingTaxCents: null, shippingTaxSnapshot: null });
  });

  it("retains explicitly calculated zero shipping VAT", () => {
    const freeSnapshot = { ...shippingSnapshot, allocationBasis: "no_shipping_charge", shippingGrossCents: 0, shippingTaxCents: 0, shippingNetCents: 0,
      breakdown: shippingSnapshot.breakdown.map((part) => ({ ...part, shippingGrossCents: 0, shippingTaxCents: 0, shippingNetCents: 0 })) };
    expect(mapOrderShippingTax({ shipping_cents: 0, shipping_tax_cents: 0, shipping_tax_snapshot: freeSnapshot }))
      .toEqual({ shippingTaxCents: 0, shippingTaxSnapshot: freeSnapshot });
  });

  it("does not recalculate saved tax from rates or new rounding rules", () => {
    const saved = { ...shippingSnapshot, shippingTaxCents: 172, shippingNetCents: 828,
      breakdown: [{ ...shippingSnapshot.breakdown[0], shippingTaxCents: 10, shippingNetCents: 90 }, shippingSnapshot.breakdown[1]] };
    expect(mapOrderShippingTax({ ...shippingRow, shipping_tax_cents: 172, shipping_tax_snapshot: saved }).shippingTaxSnapshot).toEqual(saved);
  });

  it("rejects an unknown snapshot version while preserving a separately recorded amount", () => {
    expect(mapOrderShippingTax({ ...shippingRow, shipping_tax_snapshot: { ...shippingSnapshot, version: 2 } }))
      .toEqual({ shippingTaxCents: 171, shippingTaxSnapshot: null });
  });

  it("rejects conflicting order amounts or breakdown sums", () => {
    for (const row of [
      { ...shippingRow, shipping_cents: 999 },
      { ...shippingRow, shipping_tax_cents: null },
      { ...shippingRow, shipping_tax_snapshot: { ...shippingSnapshot, shippingNetCents: 830 } },
      { ...shippingRow, shipping_tax_snapshot: { ...shippingSnapshot, breakdown: [shippingSnapshot.breakdown[0]] } },
      { ...shippingRow, shipping_tax_snapshot: { ...shippingSnapshot, breakdown: shippingSnapshot.breakdown.map((part) => ({ ...part, vatRate: 22 })) } },
    ]) expect(mapOrderShippingTax(row).shippingTaxSnapshot).toBeNull();
  });

  it("does not coerce malformed amounts into zero", () => {
    for (const amount of [undefined, null, "0", -1, 0.5, Number.NaN]) {
      expect(mapOrderShippingTax({ shipping_cents: 0, shipping_tax_cents: amount }).shippingTaxCents).toBeNull();
    }
  });
});

describe("external accounting totals", () => {
  const completeOrder = previewOrders[3];
  const item = completeOrder.items[0];

  it("derives line net only by subtracting saved VAT from saved discounted gross", () => {
    expect(orderItemNetCents(item)).toBe(1549);
    expect(orderItemNetCents({ ...item, taxSnapshot: null })).toBeNull();
    expect(orderItemNetCents({ ...item, taxCents: 1891 })).toBeNull();
    expect(orderItemNetCents({ ...item, taxCents: -1 })).toBeNull();
    expect(orderItemNetCents({ taxCents: 0, taxSnapshot: { vatRate: 22, lineTotalCents: 100, discountCents: 100, discountedLineTotalCents: 0 } })).toBe(0);
  });

  it("includes shipping once in the complete single-rate order", () => {
    expect(orderTaxGroups(completeOrder)).toEqual([{ vatRate: 22, netCents: 2033, taxCents: 447, grossCents: 2480 }]);
    expect(completeOrder.totalCents).toBe(2480);
  });

  it("groups saved discounted products and shipping at their original mixed rates", () => {
    const mixed = { ...completeOrder, subtotalCents: 11200, discountCents: 1200, shippingCents: 1000, shippingTaxCents: 171,
      shippingTaxSnapshot: mapOrderShippingTax(shippingRow).shippingTaxSnapshot, totalCents: 11000, taxCents: 1881,
      items: [
        { ...item, lineTotalCents: 1200, taxCents: 87, taxSnapshot: { vatRate: 9.5, lineTotalCents: 1200, discountCents: 200, discountedLineTotalCents: 1000 } },
        { ...item, id: "mixed-2", lineTotalCents: 10000, taxCents: 1623, taxSnapshot: { vatRate: 22, lineTotalCents: 10000, discountCents: 1000, discountedLineTotalCents: 9000 } },
      ] };
    expect(orderTaxGroups(mixed)).toEqual([
      { vatRate: 9.5, netCents: 1004, taxCents: 96, grossCents: 1100 },
      { vatRate: 22, netCents: 8115, taxCents: 1785, grossCents: 9900 },
    ]);
  });

  it("withholds grouped totals when any saved line, shipping basis or order total is incomplete or inconsistent", () => {
    for (const order of [
      previewOrders[0],
      { ...completeOrder, shippingTaxCents: null, shippingTaxSnapshot: null },
      { ...completeOrder, totalCents: completeOrder.totalCents + 1 },
      { ...completeOrder, taxCents: completeOrder.taxCents + 1 },
      { ...completeOrder, discountCents: 1 },
      { ...completeOrder, items: [{ ...item, taxSnapshot: { ...item.taxSnapshot!, discountCents: null } }] },
      { ...completeOrder, items: [{ ...item, lineTotalCents: item.lineTotalCents + 1 }] },
      { ...completeOrder, shippingTaxSnapshot: { ...completeOrder.shippingTaxSnapshot!, breakdown: [{ ...completeOrder.shippingTaxSnapshot!.breakdown[0], productsGrossCents: 1 }] } },
    ]) expect(orderTaxGroups(order)).toBeNull();
  });

  it("allows confirmed zero totals without substituting zero for missing values", () => {
    const free = { ...completeOrder, subtotalCents: 100, discountCents: 100, shippingCents: 0, shippingTaxCents: 0, taxCents: 0, totalCents: 0,
      items: [{ ...item, lineTotalCents: 100, taxCents: 0, taxSnapshot: { vatRate: 22, lineTotalCents: 100, discountCents: 100, discountedLineTotalCents: 0 } }],
      shippingTaxSnapshot: { ...completeOrder.shippingTaxSnapshot!, allocationBasis: "no_shipping_charge" as const, shippingGrossCents: 0, shippingTaxCents: 0, shippingNetCents: 0,
        breakdown: [{ vatRate: 22, productsGrossCents: 0, shippingGrossCents: 0, shippingTaxCents: 0, shippingNetCents: 0 }] } };
    expect(orderTaxGroups(free)).toEqual([{ vatRate: 22, netCents: 0, taxCents: 0, grossCents: 0 }]);
    expect(orderTaxGroups({ ...free, shippingTaxCents: null })).toBeNull();
  });
});
