import { describe, expect, it } from "vitest";

import { adminProductFormSchema } from "@/lib/validation/admin-product";

const validProduct = {
  currentSlug: "testni-izdelek",
  nameSl: "Testni izdelek",
  slug: "testni-izdelek",
  brand: "Bistrava",
  sku: "BIS-TEST",
  technology: "Ionska izmenjava",
  status: "draft",
  salesMode: "quote",
  featured: "false",
  shortDescriptionSl: "Dovolj dolg kratek opis izdelka za preverjanje.",
  descriptionSl: "To je dovolj dolg opis izdelka, ki vsebuje vse ključne informacije za veljavno preverjanje administrativnega obrazca.",
  highlights: "Prva prednost\nDruga prednost",
  seoTitle: "Testni izdelek za mehko vodo | Bistrava",
  seoDescriptionSl: "Dovolj dolg opis za iskalnike, ki jasno predstavi testni izdelek in njegove glavne lastnosti uporabniku.",
  primaryKeyword: "testni izdelek",
  secondaryKeywords: "mehka voda, preizkus",
  longTailKeywords: "izdelek za testiranje mehke vode",
  tags: "test, voda",
  priceEuros: "719,80",
  compareAtPriceEuros: "799,00",
  vatRate: "22",
  stockStatus: "in_stock",
  stockQuantity: "5",
  leadTimeDays: "3",
  warrantyMonths: "24",
  householdSizeMin: "2",
  householdSizeMax: "5",
  resinVolumeLiters: "12",
  nominalFlowLitersPerMinute: "25,5",
  maxFlowLitersPerMinute: "35",
  connectionSize: "1″",
  regenerationMode: "Volumetrično",
  saltConsumptionKg: "1,2",
  dimensions: "50 × 30 × 60 cm",
  weightKg: "28",
  drainRequired: "true",
  electricityRequired: "true",
  bypassIncluded: "false",
  installationRequired: "true",
  technicalSpecifications: "Pretok | 25 l/min\nPriključek | 1″",
  certifications: "CE\nNSF",
};

describe("admin product form", () => {
  it("normalizes prices, lists and technical specifications", () => {
    const parsed = adminProductFormSchema.parse(validProduct);

    expect(parsed.priceEuros).toBe(71980);
    expect(parsed.secondaryKeywords).toEqual(["mehka voda", "preizkus"]);
    expect(parsed.technicalSpecifications[0]).toEqual({
      labelSl: "Pretok",
      valueSl: "25 l/min",
    });
  });

  it("rejects an invalid compare-at price and household range", () => {
    const result = adminProductFormSchema.safeParse({
      ...validProduct,
      compareAtPriceEuros: "600",
      householdSizeMin: "6",
      householdSizeMax: "2",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.compareAtPriceEuros).toBeDefined();
      expect(result.error.flatten().fieldErrors.householdSizeMax).toBeDefined();
    }
  });
});
