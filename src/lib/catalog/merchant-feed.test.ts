import { describe, expect, it } from "vitest";

import { catalogProducts } from "@/lib/catalog/catalog";
import { getMerchantIdentity } from "@/lib/catalog/merchant";
import { buildMerchantFeed } from "@/lib/catalog/merchant-feed";
import type { ShippingRate } from "@/lib/commerce/shipping-rates";
import type { CatalogProduct } from "@/types/catalog";

const rates: ShippingRate[] = [
  { id: "paid", name: "Standardna dostava", priceCents: 450, minOrderCents: null, maxOrderCents: 8000, estimatedDaysMin: 1, estimatedDaysMax: 3 },
  { id: "free", name: "Brezplačna dostava", priceCents: 0, minOrderCents: 8001, maxOrderCents: null, estimatedDaysMin: 1, estimatedDaysMax: 3 },
];

function sellable(sku: string, overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  const product = catalogProducts.find((candidate) => candidate.sku === sku)!;
  return { ...product, status: "active", salesMode: "buy_now", priceCents: 8418, stockStatus: "in_stock", stockQuantity: 4, ...overrides };
}

describe("Merchant identity", () => {
  it("covers every specialist product with a Google category and a valid brand decision", () => {
    for (const product of catalogProducts) {
      const identity = getMerchantIdentity(product);
      expect(identity.googleProductCategory, product.sku).not.toBeNull();
      expect(identity.brand, product.sku).not.toBe("Več blagovnih znamk");
    }
  });

  it("uses the researched EAN and manufacturer data, letting the administration override them", () => {
    expect(getMerchantIdentity(sellable("BIS-086"))).toEqual({ brand: "RBM", gtin: "8019495399317", mpn: "29090500", googleProductCategory: 2466, identifierExists: true });
    expect(getMerchantIdentity(sellable("BIS-086", { gtin: "5425024030034", mpn: "X-1" }))).toMatchObject({ gtin: "5425024030034", mpn: "X-1" });
    expect(getMerchantIdentity(sellable("BIS-086", { gtin: "8019495399318" })).gtin).toBe("8019495399317");
  });

  it("declares missing identifiers only for products researched as having none", () => {
    expect(getMerchantIdentity(sellable("BIS-030"))).toMatchObject({ brand: null, gtin: null, mpn: null, identifierExists: false });
    expect(getMerchantIdentity(sellable("BIS-076"))).toMatchObject({ brand: "Midnight", gtin: null, mpn: null, identifierExists: false });
    expect(getMerchantIdentity(sellable("BIS-016"))).toMatchObject({ brand: "Cintropur", identifierExists: null });
  });

  it("lets an administration GTIN lift a researched missing-identifier flag", () => {
    expect(getMerchantIdentity(sellable("BIS-076", { gtin: "5425024030034" }))).toMatchObject({ gtin: "5425024030034", identifierExists: true });
  });
});

describe("Merchant feed", () => {
  it("publishes identifiers, the full description, photos and per-item Slovenian shipping", () => {
    const xml = buildMerchantFeed([sellable("BIS-086")], rates);
    expect(xml).toContain("<g:gtin>8019495399317</g:gtin>");
    expect(xml).toContain("<g:mpn>29090500</g:mpn>");
    expect(xml).toContain("<g:brand>RBM</g:brand>");
    expect(xml).toContain("<g:google_product_category>2466</g:google_product_category>");
    expect(xml).toContain("<g:price>84.18 EUR</g:price>");
    expect(xml).toContain("<g:shipping><g:country>SI</g:country><g:service>Brezplačna dostava</g:service><g:price>0.00 EUR</g:price><g:min_handling_time>1</g:min_handling_time><g:max_handling_time>2</g:max_handling_time><g:min_transit_time>1</g:min_transit_time><g:max_transit_time>3</g:max_transit_time></g:shipping>");
    expect(xml).toContain("<g:product_detail><g:section_name>Tehnične karakteristike</g:section_name>");
    expect(xml).not.toContain("bistrava-panel");
    expect(xml).not.toContain("<g:identifier_exists>");
  });

  it("charges paid shipping below the threshold, marks sales and omits unknown brands", () => {
    const xml = buildMerchantFeed([sellable("BIS-030", { priceCents: 1528, compareAtPriceCents: 1890 })], rates);
    expect(xml).toContain("<g:service>Standardna dostava</g:service><g:price>4.50 EUR</g:price>");
    expect(xml).toContain("<g:price>18.90 EUR</g:price>");
    expect(xml).toContain("<g:sale_price>15.28 EUR</g:sale_price>");
    expect(xml).toContain("<g:identifier_exists>no</g:identifier_exists>");
    expect(xml).not.toContain("<g:brand>");
  });

  it("escapes text and leaves shipping to account settings when no rate is configured", () => {
    const xml = buildMerchantFeed([sellable("BIS-016", { nameSl: "Filter <A & B>" })], []);
    expect(xml).toContain("<g:title>Filter &lt;A &amp; B&gt;</g:title>");
    expect(xml).not.toContain("<g:shipping>");
  });
});
