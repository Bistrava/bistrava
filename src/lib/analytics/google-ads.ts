import type { ConsentChoice } from "@/lib/analytics/consent";

/**
 * Google Ads conversion measurement for the Bistrava purchase action ("Bistrava - Nakup").
 * The identifiers are public tag values, not secrets; environment variables override them.
 */
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-18517768902";
export const GOOGLE_ADS_PURCHASE_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || "CynUCPzbkKkdEMb1-v1E";

const SENT_KEY_PREFIX = "bistrava-ads-purchase-";

/** Orders in these states never count as a sale. */
const NON_SALE_STATUSES = new Set(["cancelled", "refunded", "partially_refunded"]);

/** Advertising measurement runs only after the visitor chose "Dovoli vse". */
export function allowsAdvertising(choice: ConsentChoice | null) {
  return choice === "marketing";
}

export type PurchaseConversionOrder = {
  reference: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  items: Array<{ sku: string; name: string; quantity: number; unitPriceCents: number }>;
};

/** Product revenue with VAT after discounts, excluding shipping, in EUR. */
export function purchaseValueEur(order: Pick<PurchaseConversionOrder, "subtotalCents" | "discountCents">) {
  return Math.max(0, order.subtotalCents - order.discountCents) / 100;
}

export function isCountableSale(status: string) {
  return !NON_SALE_STATUSES.has(status);
}

export function purchaseSentKey(reference: string) {
  return `${SENT_KEY_PREFIX}${reference.toLowerCase()}`;
}

type DataLayerTarget = { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

/**
 * Sends the purchase once per order reference in this browser. Google also deduplicates by
 * transaction_id, so a reload or a second device cannot inflate the count. Returns true when sent.
 */
export function sendPurchaseConversion(
  target: DataLayerTarget,
  storage: Pick<Storage, "getItem" | "setItem"> | null,
  choice: ConsentChoice | null,
  order: PurchaseConversionOrder,
): boolean {
  if (!allowsAdvertising(choice) || !isCountableSale(order.status)) return false;
  const key = purchaseSentKey(order.reference);
  try {
    if (storage?.getItem(key)) return false;
  } catch {
    // Storage may be blocked; Google still deduplicates by transaction_id.
  }

  const value = purchaseValueEur(order);
  target.dataLayer = target.dataLayer || [];
  if (typeof target.gtag !== "function") return false;
  target.gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
    value,
    currency: "EUR",
    transaction_id: order.reference,
  });
  target.dataLayer.push({ ecommerce: null });
  target.dataLayer.push({
    event: "purchase",
    ecommerce: {
      transaction_id: order.reference,
      currency: "EUR",
      value,
      items: order.items.map((item) => ({
        item_id: item.sku,
        item_name: item.name,
        price: item.unitPriceCents / 100,
        quantity: item.quantity,
      })),
    },
  });

  try {
    storage?.setItem(key, new Date().toISOString());
  } catch {
    // Not fatal: transaction_id prevents duplicates on Google's side.
  }
  return true;
}
