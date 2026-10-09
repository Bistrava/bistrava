import { describe, expect, it } from "vitest";
import { getEligibleShippingRates, type ShippingRate } from "@/lib/commerce/shipping-rates";

const paid: ShippingRate = { id: "paid", name: "Standardna dostava", priceCents: 450, minOrderCents: null, maxOrderCents: 8000, estimatedDaysMin: null, estimatedDaysMax: null };
const free: ShippingRate = { ...paid, id: "free", name: "Brezplačna dostava", priceCents: 0, minOrderCents: 8001, maxOrderCents: null };
const rates = [free, paid];

describe("Slovenian shipping thresholds", () => {
  it.each([1, 7999, 8000])("charges 4.50 EUR for a %i-cent products subtotal", (subtotal) => {
    expect(getEligibleShippingRates(rates, subtotal)).toEqual([paid]);
  });
  it.each([8001, 8002, 100000])("offers only free shipping above 80 EUR (%i cents)", (subtotal) => {
    expect(getEligibleShippingRates(rates, subtotal)).toEqual([free]);
  });
  it("fails closed for an empty cart or invalid totals and gaps", () => {
    for (const value of [0, -1, Number.NaN, Infinity, 80.01]) expect(getEligibleShippingRates(rates, value)).toEqual([]);
    expect(getEligibleShippingRates([free], 8000)).toEqual([]);
    expect(getEligibleShippingRates([], 9000)).toEqual([]);
  });
  it("supports unbounded alternatives and does not mutate rate order", () => {
    const express = { ...paid, id: "express", priceCents: 900, maxOrderCents: null };
    expect(getEligibleShippingRates([express, free, paid], 9000)).toEqual([free, express]);
    expect(rates).toEqual([free, paid]);
  });
});
