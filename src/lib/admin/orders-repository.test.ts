import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ access: vi.fn(), client: vi.fn(), from: vi.fn(), orderSelect: vi.fn(), rows: [] as Record<string, unknown>[] }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin", () => ({ getAdminAccess: mocks.access }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));

import { getAdminCommerceData } from "@/lib/admin/orders-repository";

const orderRow = {
  id: "10000000-0000-4000-8000-000000000001", reference: "BIS-TEST-ACCOUNTING", status: "pending", email: "test@example.com",
  subtotal_cents: 1000, discount_cents: 100, shipping_cents: 590, shipping_tax_cents: 106,
  tax_cents: 268, total_cents: 1490,
  shipping_tax_snapshot: {
    version: 1, method: "proportional_discounted_gross_by_vat_rate", rounding: "half_up_cumulative_gross_then_half_up_tax_per_rate",
    allocationBasis: "discounted_products_gross", shippingGrossCents: 590, shippingTaxCents: 106, shippingNetCents: 484,
    breakdown: [{ vatRate: 22, productsGrossCents: 900, shippingGrossCents: 590, shippingTaxCents: 106, shippingNetCents: 484 }],
  },
  order_items: [{ id: "item-1", sku: "TEST-1", product_name: "Saved product", quantity: 1, unit_price_cents: 1000, line_total_cents: 1000, tax_cents: 162,
    product_snapshot: { vatRate: 22, lineTotalCents: 1000, discountCents: 100, discountedLineTotalCents: 900 } }],
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.rows = [orderRow];
  mocks.access.mockResolvedValue({ status: "authorized", userId: "admin", role: "admin" });
  mocks.orderSelect.mockImplementation(() => ({ order: async () => ({ data: mocks.rows, error: null }) }));
  mocks.from.mockImplementation((table: string) => {
    if (table === "orders") return { select: mocks.orderSelect };
    if (table === "profiles") return { select: () => ({ order: async () => ({ data: [], error: null }) }) };
    if (table === "admin_roles") return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
    throw new Error("Unexpected table");
  });
  mocks.client.mockResolvedValue({ from: mocks.from });
});

describe("private accounting read model", () => {
  it("maps saved snapshots without changing the tax-inclusive order or payment total", async () => {
    const data = await getAdminCommerceData();
    expect(data.source).toBe("live");
    expect(data.orders[0]).toMatchObject({ subtotalCents: 1000, discountCents: 100, shippingCents: 590, shippingTaxCents: 106, taxCents: 268, totalCents: 1490,
      shippingTaxSnapshot: { shippingGrossCents: 590, shippingNetCents: 484, shippingTaxCents: 106 },
      items: [{ taxCents: 162, lineTotalCents: 1000, taxSnapshot: { vatRate: 22, discountCents: 100, discountedLineTotalCents: 900 } }] });
    expect(mocks.orderSelect).toHaveBeenCalledWith(expect.stringContaining("shipping_tax_cents,shipping_tax_snapshot"));
    expect(mocks.orderSelect).toHaveBeenCalledWith(expect.stringContaining("line_total_cents,product_snapshot"));
    expect(mocks.from.mock.calls.map(([table]) => table)).toEqual(["orders", "profiles", "admin_roles"]);
  });

  it("keeps historical shipping and missing per-line discounts unknown", async () => {
    mocks.rows = [{ ...orderRow, shipping_tax_cents: null, shipping_tax_snapshot: null,
      order_items: [{ ...orderRow.order_items[0], product_snapshot: { vatRate: 9.5, lineTotalCents: 1000 } }] }];
    const { orders } = await getAdminCommerceData();
    expect(orders[0]).toMatchObject({ shippingTaxCents: null, shippingTaxSnapshot: null, totalCents: 1490,
      items: [{ taxSnapshot: { vatRate: 9.5, lineTotalCents: 1000, discountCents: null, discountedLineTotalCents: null } }] });
  });

  it('maps proof receipt separately from payment and fulfillment status', async () => {
    mocks.rows = [{ ...orderRow, status: 'awaiting_payment', transfer_proof_received_at: '2026-10-19T12:00:00Z', transfer_proof_reference: 'Email BIS-TEST-ACCOUNTING' }];
    const { orders } = await getAdminCommerceData();
    expect(orders[0]).toMatchObject({ status: 'awaiting_payment', transferProofReceivedAt: '2026-10-19T12:00:00Z', transferProofReference: 'Email BIS-TEST-ACCOUNTING', completedAt: null, payment: null });
  });

  it.each(["unauthenticated", "forbidden"])("does not read accounting data when access is %s", async (status) => {
    mocks.access.mockResolvedValue({ status });
    expect(await getAdminCommerceData()).toEqual({ source: "unavailable", orders: [], profiles: [] });
    expect(mocks.client).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
