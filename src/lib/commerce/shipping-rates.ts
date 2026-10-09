export type ShippingRate = {
  id: string;
  name: string;
  priceCents: number;
  minOrderCents: number | null;
  maxOrderCents: number | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
};

// Use the products' VAT-inclusive subtotal, before coupon reductions and shipping.
// This mirrors calculate_guest_checkout_quote; both bounds are inclusive.
export function getEligibleShippingRates(rates: ShippingRate[], subtotalCents: number): ShippingRate[] {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents <= 0) return [];
  return rates.filter((rate) =>
    Number.isSafeInteger(rate.priceCents) && rate.priceCents >= 0 &&
    (rate.minOrderCents === null || subtotalCents >= rate.minOrderCents) &&
    (rate.maxOrderCents === null || subtotalCents <= rate.maxOrderCents),
  ).sort((a, b) => a.priceCents - b.priceCents || a.id.localeCompare(b.id));
}
