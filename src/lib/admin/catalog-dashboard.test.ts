import { describe, expect, it } from "vitest";

import {
  getAdminCatalogMetrics,
  getAdminCatalogProducts,
  getProductReadiness,
} from "@/lib/admin/catalog-dashboard";
import { specialistProducts } from "@/lib/catalog/catalog";

describe("admin catalog dashboard", () => {
  it("exposes the 24 specialist drafts without the archived source rows", () => {
    const products = getAdminCatalogProducts();

    expect(products).toHaveLength(24);
    expect(products.every((product) => product.status === "draft")).toBe(true);
  });

  it("keeps commercial activation fields visible in the readiness score", () => {
    const readiness = getProductReadiness(specialistProducts[0]);

    expect(readiness.total).toBe(9);
    expect(readiness.missing).toContain("sellingPrice");
    expect(readiness.missing).toContain("publicStock");
  });

  it("summarizes the retained specialist catalog", () => {
    const metrics = getAdminCatalogMetrics();

    expect(metrics.total).toBe(24);
    expect(metrics.drafts).toBe(24);
    expect(metrics.active).toBe(0);
    expect(metrics.archived).toBe(0);
    expect(metrics.missingSellingPrice).toBe(24);
  });
});
