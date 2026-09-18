import { describe, expect, it } from "vitest";

import {
  allCategories,
  archivedProducts,
  catalogProducts,
  getCatalogCategory,
  specialistProducts,
} from "@/lib/catalog/catalog";

describe("SEO catalog import", () => {
  it("contains every workbook product with unique IDs and slugs", () => {
    expect(catalogProducts).toHaveLength(86);
    expect(new Set(catalogProducts.map((product) => product.id)).size).toBe(86);
    expect(new Set(catalogProducts.map((product) => product.slug)).size).toBe(
      86,
    );
  });

  it("maps every product to an existing category", () => {
    expect(allCategories).toHaveLength(4);

    for (const product of catalogProducts) {
      expect(getCatalogCategory(product.categorySlug)).toBeDefined();
    }
  });

  it("keeps a focused 24-product draft catalog and archives the rest", () => {
    expect(specialistProducts).toHaveLength(24);
    expect(archivedProducts).toHaveLength(62);

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

  it("preserves the workbook priority distribution", () => {
    const counts = Object.groupBy(
      catalogProducts,
      (product) => product.priority,
    );

    expect(counts["Prednost A"]).toHaveLength(36);
    expect(counts["Prednost B"]).toHaveLength(32);
    expect(counts.Test).toHaveLength(18);
  });
});
