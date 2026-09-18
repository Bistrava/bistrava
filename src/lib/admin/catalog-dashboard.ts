import { allCategories, catalogProducts, specialistProducts } from "@/lib/catalog/catalog";
import type { CatalogProduct } from "@/types/catalog";

export type ProductReadinessCheckId =
  | "content"
  | "gallery"
  | "technicalSpecifications"
  | "supplierSource"
  | "sellingPrice"
  | "publicStock"
  | "leadTime"
  | "warranty"
  | "technicalDocuments";

export type AdminProductSummary = {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  categoryName: string;
  status: CatalogProduct["status"];
  salesMode: CatalogProduct["salesMode"];
  stockStatus: CatalogProduct["stockStatus"];
  stockQuantity: number;
  priceCents: number | null;
  supplierPriceCents: number | null;
  image: { url: string; alt: string } | null;
  readiness: {
    completed: number;
    total: number;
    percentage: number;
    missing: ProductReadinessCheckId[];
  };
};

const categoryNames = new Map(
  allCategories.map((category) => [category.slug, category.shortName]),
);

export function getProductReadiness(product: CatalogProduct) {
  const checks = [
    {
      id: "content",
      complete:
        product.descriptionSl.trim().length > 0 &&
        product.seoDescriptionSl.trim().length > 0,
    },
    { id: "gallery", complete: product.images.length >= 4 },
    {
      id: "technicalSpecifications",
      complete: product.technicalSpecifications.length > 0,
    },
    {
      id: "supplierSource",
      complete:
        product.supplierPriceCents !== null &&
        Boolean(product.supplierPriceSourceUrl),
    },
    { id: "sellingPrice", complete: product.priceCents !== null },
    {
      id: "publicStock",
      complete: product.stockStatus !== "unverified",
    },
    { id: "leadTime", complete: product.leadTimeDays !== null },
    { id: "warranty", complete: product.warrantyMonths !== null },
    {
      id: "technicalDocuments",
      complete: product.technicalDocuments.length > 0,
    },
  ] satisfies Array<{ id: ProductReadinessCheckId; complete: boolean }>;
  const completed = checks.filter((check) => check.complete).length;

  return {
    completed,
    total: checks.length,
    percentage: Math.round((completed / checks.length) * 100),
    missing: checks.filter((check) => !check.complete).map((check) => check.id),
  };
}

export function getAdminCatalogProducts(
  products: CatalogProduct[] = specialistProducts,
): AdminProductSummary[] {
  return products.map((product) => ({
    sku: product.sku,
    slug: product.slug,
    name: product.nameSl,
    brand: product.brand,
    categorySlug: product.status === "archived" ? product.sourceCategorySlug : product.categorySlug,
    categoryName: product.status === "archived"
      ? product.sourceCategory
      : categoryNames.get(product.categorySlug) ?? product.categorySlug,
    status: product.status,
    salesMode: product.salesMode,
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity,
    priceCents: product.priceCents,
    supplierPriceCents: product.supplierPriceCents,
    image: product.images[0]
      ? { url: product.images[0].url, alt: product.images[0].altSl }
      : null,
    readiness: getProductReadiness(product),
  }));
}

export function getAdminCatalogMetrics(products = getAdminCatalogProducts()) {
  const readinessTotal = products.reduce(
    (sum, product) => sum + product.readiness.percentage,
    0,
  );

  return {
    total: products.length,
    active: products.filter((product) => product.status === "active").length,
    drafts: products.filter((product) => product.status === "draft").length,
    archived: catalogProducts.filter((product) => product.status === "archived").length,
    withSupplierSource: products.filter(
      (product) => product.supplierPriceCents !== null,
    ).length,
    missingSellingPrice: products.filter((product) => product.priceCents === null)
      .length,
    averageReadiness:
      products.length > 0 ? Math.round(readinessTotal / products.length) : 0,
  };
}

export type AdminCatalogMetrics = ReturnType<typeof getAdminCatalogMetrics>;
