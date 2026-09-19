import { describe, expect, it } from "vitest";

import {
  allCategories,
  archivedProducts,
  catalogProducts,
  getCatalogCategory,
  getProductsByCategory,
  specialistProducts,
} from "@/lib/catalog/catalog";

describe("SEO catalog import", () => {
  it("keeps only products that have an image and a verified price", () => {
    expect(catalogProducts).toHaveLength(24);
    expect(new Set(catalogProducts.map((product) => product.id)).size).toBe(24);
    expect(new Set(catalogProducts.map((product) => product.slug)).size).toBe(
      24,
    );
    expect(catalogProducts.every((product) => product.images.length > 0)).toBe(true);
    expect(
      catalogProducts.every(
        (product) => product.priceCents !== null || product.supplierPriceCents !== null,
      ),
    ).toBe(true);
  });

  it("maps every product to an existing category", () => {
    expect(allCategories).toHaveLength(4);

    for (const product of catalogProducts) {
      expect(getCatalogCategory(product.categorySlug)).toBeDefined();
    }
  });

  it("exposes all imported products through the public category groups", () => {
    const groupedProducts = allCategories.flatMap((category) =>
      getProductsByCategory(category.slug),
    );

    expect(groupedProducts).toHaveLength(24);
    expect(new Set(groupedProducts.map((product) => product.id)).size).toBe(24);
  });

  it("keeps a focused 24-product draft catalog and removes incomplete references", () => {
    expect(specialistProducts).toHaveLength(24);
    expect(archivedProducts).toHaveLength(0);

    for (const product of specialistProducts) {
      expect(product.status).toBe("draft");
      expect(product.priceCents).toBeNull();
      expect(product.stockQuantity).toBe(5);
      expect(product.stockStatus).toBe("unverified");
      expect(product.shortDescriptionSl.length).toBeGreaterThan(100);
      expect(product.descriptionSl.length).toBeGreaterThan(500);
      expect(product.highlightsSl).toHaveLength(4);
      expect(product.technicalSpecifications.length).toBeGreaterThanOrEqual(5);
      expect(product.images).toHaveLength(4);
      expect(new Set(product.images.map((image) => image.url)).size).toBe(4);
      expect(product.images.every((image) => image.altSl.includes(product.nameSl))).toBe(true);
    }
  });

  it("attaches traceable public source prices without creating selling prices", () => {
    const pricedProducts = specialistProducts.filter(
      (product) => product.supplierPriceCents !== null,
    );
    expect(pricedProducts).toHaveLength(24);

    for (const product of pricedProducts) {
      expect(product.priceCents).toBeNull();
      expect(product.supplierPriceCents).toBeGreaterThan(0);
      expect(product.supplierPriceIncludesVat).toBe(true);
      expect(product.supplierPriceSourceName).toBeTruthy();
      expect(product.supplierPriceSourceUrl).toMatch(/^https:\/\//);
      expect(product.supplierPriceObservedAt).toBe("2026-08-24");
      expect(product.supplierPriceNoteSl).toContain("ne predstavlja");
    }
  });

  it("keeps the validated SEO fields within the workbook limits", () => {
    for (const product of catalogProducts) {
      expect(product.seoTitle.length).toBeLessThanOrEqual(60);
      expect(product.sourceMetaDescription.length).toBeLessThanOrEqual(160);
      expect(product.h1.trim()).not.toBe("");
      expect(product.primaryKeyword.trim()).not.toBe("");
    }
  });

  it("ships complete Slovenian SEO fields for every specialist product", () => {
    for (const product of specialistProducts) {
      expect(product.seoTitle.length).toBeLessThanOrEqual(60);
      expect(product.seoDescriptionSl.length).toBeLessThanOrEqual(160);
      expect(product.seoDescriptionSl.length).toBeGreaterThan(100);
      expect(product.nameSl).toBe(product.h1);
      expect(product.researchSourceUrl).toBe(product.supplierPriceSourceUrl);
    }
  });

});
