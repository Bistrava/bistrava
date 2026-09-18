import type { CatalogProduct } from "@/types/catalog";

export type AdminProductEditorValues = {
  currentSlug: string;
  nameSl: string;
  slug: string;
  brand: string;
  sku: string;
  technology: string;
  status: CatalogProduct["status"];
  salesMode: CatalogProduct["salesMode"];
  featured: "true" | "false";
  shortDescriptionSl: string;
  descriptionSl: string;
  highlights: string;
  seoTitle: string;
  seoDescriptionSl: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  longTailKeywords: string;
  tags: string;
  priceEuros: string;
  compareAtPriceEuros: string;
  vatRate: string;
  stockStatus: CatalogProduct["stockStatus"];
  stockQuantity: string;
  leadTimeDays: string;
  warrantyMonths: string;
  householdSizeMin: string;
  householdSizeMax: string;
  resinVolumeLiters: string;
  nominalFlowLitersPerMinute: string;
  maxFlowLitersPerMinute: string;
  connectionSize: string;
  regenerationMode: string;
  saltConsumptionKg: string;
  dimensions: string;
  weightKg: string;
  drainRequired: "" | "true" | "false";
  electricityRequired: "" | "true" | "false";
  bypassIncluded: "" | "true" | "false";
  installationRequired: "true" | "false";
  technicalSpecifications: string;
  certifications: string;
};

export type AdminProductEditorData = {
  values: AdminProductEditorValues;
  categorySlug: string;
  categoryName: string;
  image: { url: string; alt: string } | null;
  imageCount: number;
  documentCount: number;
  supplierPriceCents: number | null;
  supplierPriceSourceName: string | null;
  supplierPriceSourceUrl: string | null;
  updatedAt: string;
};

function optionalNumber(value: number | null) {
  return value === null ? "" : String(value);
}

function optionalBoolean(value: boolean | null): "" | "true" | "false" {
  if (value === null) return "";
  return value ? "true" : "false";
}

function money(value: number | null) {
  return value === null ? "" : (value / 100).toFixed(2);
}

export function createAdminProductEditorData(
  product: CatalogProduct,
  categoryName: string,
): AdminProductEditorData {
  return {
    values: {
      currentSlug: product.slug,
      nameSl: product.nameSl,
      slug: product.slug,
      brand: product.brand,
      sku: product.sku,
      technology: product.technology,
      status: product.status,
      salesMode: product.salesMode,
      featured: product.featured ? "true" : "false",
      shortDescriptionSl: product.shortDescriptionSl,
      descriptionSl: product.descriptionSl,
      highlights: product.highlightsSl.join("\n"),
      seoTitle: product.seoTitle,
      seoDescriptionSl: product.seoDescriptionSl,
      primaryKeyword: product.primaryKeyword,
      secondaryKeywords: product.secondaryKeywords.join(", "),
      longTailKeywords: product.longTailKeywords.join(", "),
      tags: product.categorySlug,
      priceEuros: money(product.priceCents),
      compareAtPriceEuros: money(product.compareAtPriceCents),
      vatRate: String(product.vatRate),
      stockStatus: product.stockStatus,
      stockQuantity: String(product.stockQuantity),
      leadTimeDays: optionalNumber(product.leadTimeDays),
      warrantyMonths: optionalNumber(product.warrantyMonths),
      householdSizeMin: optionalNumber(product.householdSizeMin),
      householdSizeMax: optionalNumber(product.householdSizeMax),
      resinVolumeLiters: optionalNumber(product.resinVolumeLiters),
      nominalFlowLitersPerMinute: optionalNumber(
        product.nominalFlowLitersPerMinute,
      ),
      maxFlowLitersPerMinute: optionalNumber(product.maxFlowLitersPerMinute),
      connectionSize: product.connectionSize ?? "",
      regenerationMode: product.regenerationMode ?? "",
      saltConsumptionKg: optionalNumber(product.saltConsumptionKg),
      dimensions: product.dimensions ?? "",
      weightKg: optionalNumber(product.weightKg),
      drainRequired: optionalBoolean(product.drainRequired),
      electricityRequired: optionalBoolean(product.electricityRequired),
      bypassIncluded: optionalBoolean(product.bypassIncluded),
      installationRequired: product.installationRequired ? "true" : "false",
      technicalSpecifications: product.technicalSpecifications
        .map((item) => `${item.labelSl} | ${item.valueSl}`)
        .join("\n"),
      certifications: product.certifications.join("\n"),
    },
    categorySlug: product.status === "archived" ? product.sourceCategorySlug : product.categorySlug,
    categoryName,
    image: product.images[0]
      ? { url: product.images[0].url, alt: product.images[0].altSl }
      : null,
    imageCount: product.images.length,
    documentCount: product.technicalDocuments.length,
    supplierPriceCents: product.supplierPriceCents,
    supplierPriceSourceName: product.supplierPriceSourceName,
    supplierPriceSourceUrl: product.supplierPriceSourceUrl,
    updatedAt: product.updatedAt,
  };
}
