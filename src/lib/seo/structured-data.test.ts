import { describe, expect, it } from "vitest";

import { specialistProducts } from "@/lib/catalog/catalog";
import { productSchema } from "@/lib/seo/structured-data";

const sourceProduct = specialistProducts[0]!;

describe("productSchema", () => {
  it("does not invent an Offer for an active quote-only product", () => {
    const schema = productSchema({
      ...sourceProduct,
      status: "active",
      salesMode: "quote",
    });
    expect(schema["@type"]).toBe("Product");
    expect(schema).not.toHaveProperty("offers");
  });

  it("adds an Offer only when price and public availability are verified", () => {
    const schema = productSchema({
      ...sourceProduct,
      status: "active",
      salesMode: "buy_now",
      priceCents: 129900,
      stockStatus: "in_stock",
    });
    expect(schema.offers).toMatchObject({
      "@type": "Offer",
      priceCurrency: "EUR",
      price: "1299.00",
      availability: "https://schema.org/InStock",
    });
  });
});
