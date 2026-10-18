import { describe, expect, it } from "vitest";

import { specialistProducts } from "@/lib/catalog/catalog";
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
});
