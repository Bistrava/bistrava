import { describe, expect, it } from "vitest";

import {
  recommendProducts,
  type ConfiguratorInput,
  type ConfiguratorProduct,
} from "@/lib/configurator/recommendation-engine";

const baseInput: ConfiguratorInput = {
  municipality: "Ljubljana",
  postalCode: "1000",
  hardnessDgh: 16,
  dwellingType: "house",
  residents: 4,
  monthlyUsageM3: 18,
  bathrooms: 2,
  waterHeater: "heat_pump",
  availableSpace: "standard",
  connectionSize: "1″",
  installationNeed: "yes",
};

function product(overrides: Partial<ConfiguratorProduct>): ConfiguratorProduct {
  return {
    sku: "BIS-TEST",
    slug: "testni-mehcalec",
    nameSl: "Testni mehčalec",
    brand: "Bistrava",
    shortDescriptionSl: "Preverjen testni izdelek.",
    unitPriceCents: 89900,
    imageUrl: null,
    imageAltSl: "Testni mehčalec",
    stockQuantity: 5,
    householdSizeMin: 2,
    householdSizeMax: 5,
    resinVolumeLiters: 20,
    maxFlowLitersPerMinute: 30,
    connectionSize: "1″",
    dimensions: "600 × 300 × 450 mm",
    installationRequired: true,
    ...overrides,
  };
}

const products = [
  product({
    sku: "COMPACT",
    slug: "compact",
    nameSl: "Compact 12 L",
    householdSizeMin: 1,
    householdSizeMax: 3,
    resinVolumeLiters: 12,
    maxFlowLitersPerMinute: 20,
    connectionSize: "3/4″",
  }),
  product({ sku: "STANDARD", slug: "standard", nameSl: "Standard 20 L" }),
  product({
    sku: "HIGH",
    slug: "high-flow",
    nameSl: "High Flow 30 L",
    householdSizeMin: 3,
    householdSizeMax: 8,
    resinVolumeLiters: 30,
    maxFlowLitersPerMinute: 45,
  }),
];

describe("recommendProducts", () => {
  it("requests a hardness measurement before recommending products", () => {
    const result = recommendProducts({ ...baseInput, hardnessDgh: null }, products);
    expect(result.needsAdvice).toBe(true);
    expect(result.recommendations).toEqual([]);
  });

  it("returns real catalog products with explainable reasons", () => {
    const result = recommendProducts(baseInput, products);
    expect(result.needsAdvice).toBe(false);
    expect(result.recommendations).toHaveLength(3);
    expect(result.recommendations[0]?.product.sku).toBe("STANDARD");
    expect(result.recommendations[0]?.matchLabelSl).toBe("Najboljše ujemanje");
    expect(result.recommendations[0]?.reasonsSl.length).toBeGreaterThan(1);
  });

  it("prioritizes a high-capacity product for a larger household", () => {
    const result = recommendProducts({
      ...baseInput,
      residents: 7,
      bathrooms: 3,
      monthlyUsageM3: 30,
    }, products);
    expect(result.recommendations[0]?.product.sku).toBe("HIGH");
  });

  it("prioritizes a compact product for a small apartment", () => {
    const result = recommendProducts({
      ...baseInput,
      dwellingType: "apartment",
      residents: 2,
      bathrooms: 1,
      monthlyUsageM3: 8,
      availableSpace: "compact",
      connectionSize: "3/4″",
    }, products);
    expect(result.recommendations[0]?.product.sku).toBe("COMPACT");
  });

  it("does not recommend central softening for a low reading", () => {
    const result = recommendProducts({ ...baseInput, hardnessDgh: 5 }, products);
    expect(result.needsAdvice).toBe(true);
  });
});
