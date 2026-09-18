import { describe, expect, it } from "vitest";

import { productDraftSchema, slugSchema } from "./catalog";

describe("catalog validation", () => {
  it("accepts Slovenian URL slugs without accented URL characters", () => {
    expect(slugSchema.parse("filtracija-celega-doma")).toBe(
      "filtracija-celega-doma",
    );
  });

  it("rejects a promotion price that is not above the current price", () => {
    const result = productDraftSchema.safeParse({
      name: "Testni filter",
      slug: "testni-filter",
      brand: "Test",
      sku: "TEST-001",
      shortDescription: "Dovolj dolg opis za preverjanje veljavnosti izdelka.",
      priceCents: 10_000,
      compareAtPriceCents: 9_000,
      currency: "EUR",
    });

    expect(result.success).toBe(false);
  });

  it("does not require GTIN or MPN", () => {
    const result = productDraftSchema.safeParse({
      name: "Testni filter",
      slug: "testni-filter",
      brand: "Test",
      sku: "TEST-001",
      shortDescription: "Dovolj dolg opis za preverjanje veljavnosti izdelka.",
      priceCents: 10_000,
      currency: "EUR",
    });

    expect(result.success).toBe(true);
  });
});
