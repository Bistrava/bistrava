import { describe, expect, it, vi } from "vitest";

import {
  GOOGLE_ADS_ID,
  GOOGLE_ADS_PURCHASE_LABEL,
  purchaseSentKey,
  purchaseValueEur,
  sendPurchaseConversion,
  type PurchaseConversionOrder,
} from "@/lib/analytics/google-ads";

const order: PurchaseConversionOrder = {
  reference: "BIS-261025-5E2565F4",
  status: "awaiting_payment",
  subtotalCents: 90612,
  discountCents: 2000,
  items: [{ sku: "BIS-067", name: "Pentair Optimo CS Mini", quantity: 1, unitPriceCents: 90612 }],
};

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void values.set(key, value)),
  };
}

describe("Google Ads purchase conversion", () => {
  it("counts product value with VAT after discounts, without shipping", () => {
    expect(purchaseValueEur(order)).toBe(886.12);
    expect(purchaseValueEur({ subtotalCents: 500, discountCents: 900 })).toBe(0);
  });

  it("sends nothing without advertising consent", () => {
    for (const choice of [null, "denied", "statistics"] as const) {
      const gtag = vi.fn();
      expect(sendPurchaseConversion({ gtag }, memoryStorage(), choice, order)).toBe(false);
      expect(gtag).not.toHaveBeenCalled();
    }
  });

  it("sends one conversion per order reference with the order reference as transaction id", () => {
    const gtag = vi.fn();
    const target = { gtag, dataLayer: [] as unknown[] };
    const storage = memoryStorage();

    expect(sendPurchaseConversion(target, storage, "marketing", order)).toBe(true);
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      value: 886.12,
      currency: "EUR",
      transaction_id: order.reference,
    });
    expect(target.dataLayer).toContainEqual(expect.objectContaining({ event: "purchase" }));
    expect(storage.setItem).toHaveBeenCalledWith(purchaseSentKey(order.reference), expect.any(String));

    expect(sendPurchaseConversion(target, storage, "marketing", order)).toBe(false);
    expect(gtag).toHaveBeenCalledOnce();
  });

  it("never counts cancelled or refunded orders", () => {
    for (const status of ["cancelled", "refunded", "partially_refunded"]) {
      const gtag = vi.fn();
      expect(sendPurchaseConversion({ gtag }, memoryStorage(), "marketing", { ...order, status })).toBe(false);
      expect(gtag).not.toHaveBeenCalled();
    }
  });

  it("still sends when browser storage is blocked", () => {
    const gtag = vi.fn();
    const blocked = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    expect(sendPurchaseConversion({ gtag }, blocked, "marketing", order)).toBe(true);
    expect(gtag).toHaveBeenCalledOnce();
  });
});
