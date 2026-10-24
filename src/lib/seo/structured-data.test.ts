import { describe, expect, it } from "vitest";

import { specialistProducts } from "@/lib/catalog/catalog";
import { productDeliveryEstimate } from "@/lib/content/delivery";
import { organizationSchema, productSchema } from "@/lib/seo/structured-data";
import { siteConfig } from "@/lib/seo/site";

const sourceProduct = specialistProducts[0]!;

describe("organizationSchema", () => {
  it("identifies the legal seller while keeping the store brand", () => {
    expect(organizationSchema()).toMatchObject({
      "@type": "Organization",
      name: "Bistrava",
      legalName: "PUREH2O, razvojni inženiring, d.o.o.",
      alternateName: "PUREH2O d.o.o.",
      taxID: "12238147",
      vatID: "SI12238147",
      identifier: { propertyID: "Matična številka", value: "8583056000" },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Srebrniče 18A",
        postalCode: "8000",
        addressLocality: "Novo mesto",
        addressCountry: "SI",
      },
      email: "kontakt@bistrava.com",
      telephone: "+386 40 634 639",
    });
    expect(organizationSchema()).not.toHaveProperty("hasMerchantReturnPolicy");
  });
});

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
      url: new URL(sourceProduct.canonical, siteConfig.url).href,
    });
    expect(schema.url).toBe(new URL(sourceProduct.canonical, siteConfig.url).href);
  });

  it("adds manufacturer identifiers and Slovenian shipping details to the Offer", () => {
    const product = { ...specialistProducts.find((candidate) => candidate.sku === "BIS-086")!, status: "active" as const, salesMode: "buy_now" as const, priceCents: 8418, stockStatus: "in_stock" as const };
    const delivery = productDeliveryEstimate([
      { id: "free", name: "Brezplačna dostava", priceCents: 0, minOrderCents: 8001, maxOrderCents: null, estimatedDaysMin: 1, estimatedDaysMax: 3 },
    ], product.priceCents);
    const schema = productSchema(product, delivery);
    expect(schema).toMatchObject({ brand: { name: "RBM" }, gtin: "8019495399317", mpn: "29090500" });
    expect(schema.offers).toMatchObject({
      shippingDetails: {
        shippingRate: { value: "0.00", currency: "EUR" },
        shippingDestination: { addressCountry: "SI" },
        deliveryTime: { handlingTime: { minValue: 1, maxValue: 2 }, transitTime: { minValue: 1, maxValue: 3 } },
      },
    });
  });
});
