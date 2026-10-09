import type { CatalogProduct } from "@/types/catalog";

export const catalogProductSelect = "*,product_images(id,storage_path,alt_text,width,height,sort_order,is_primary),product_documents(id),product_categories(sort_order,categories(slug,name))";
type DatabaseImage = { id?: string; storage_path: string; alt_text: string; width?: number | null; height?: number | null; sort_order: number; is_primary: boolean };
export type DatabaseCatalogRow = Record<string, unknown> & {
  id: string; slug: string; name: string; brand: string;
  product_images?: DatabaseImage[];
  product_documents?: Array<{ id: string }>;
  product_categories?: Array<{ sort_order?: number; categories: { slug: string; name: string } | null }>;
};
export function databaseProductImageUrl(baseUrl: string, path: string) {
  return `${baseUrl}/storage/v1/object/public/product-media/${path.split("/").map(encodeURIComponent).join("/")}`;
}
export function databaseProductImages(row: DatabaseCatalogRow) {
  return [...(row.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
}
export function databaseProductCategory(row: DatabaseCatalogRow) {
  return [...(row.product_categories ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.categories ?? null;
}
/** New database products are first-class catalogue entries without requiring a code import. */
export function mapDatabaseProduct(row: DatabaseCatalogRow, baseUrl: string, local?: CatalogProduct): CatalogProduct {
  const str = (key: string, fallback = "") => typeof row[key] === "string" ? row[key] as string : fallback;
  const num = (key: string) => row[key] === null || row[key] === undefined ? null : Number(row[key]);
  const bool = (key: string) => typeof row[key] === "boolean" ? row[key] as boolean : null;
  const list = (key: string) => Array.isArray(row[key]) ? (row[key] as unknown[]).filter((item): item is string => typeof item === "string") : [];
  const category = databaseProductCategory(row);
  const categorySlug = category?.slug ?? local?.categorySlug ?? "meritve-in-montaza";
  const name = str("name_sl") || row.name;
  const specs = Array.isArray(row.technical_specs) ? row.technical_specs.flatMap((item) => {
    if (!item || typeof item !== "object" || typeof item.labelSl !== "string" || typeof item.valueSl !== "string") return [];
    return [{ labelSl: item.labelSl, valueSl: item.valueSl }];
  }) : [];
  return {
    id: row.id, priority: local?.priority ?? "Test", sourceCategory: category?.name ?? local?.sourceCategory ?? "",
    categorySlug, sourceCategorySlug: categorySlug, brand: row.brand, name,
    primaryKeyword: str("primary_keyword"), secondaryKeywords: list("secondary_keywords"), longTailKeywords: list("long_tail_keywords"),
    searchIntent: local?.searchIntent ?? "nakup", slug: row.slug, h1: name,
    seoTitle: str("seo_title") || `${name} | Bistrava`, sourceMetaDescription: str("seo_description"),
    researchSourceUrl: local?.researchSourceUrl ?? "", researchNote: local?.researchNote ?? "", seoScore: local?.seoScore ?? 0, sourceRow: local?.sourceRow ?? 0,
    sku: str("sku", row.id), status: row.status === "published" || row.status === "active" ? "active" : row.status === "archived" ? "archived" : "draft",
    technology: str("technology"), nameSl: name,
    shortDescriptionSl: str("short_description_sl") || str("short_description"), descriptionSl: str("description_sl") || str("description"),
    seoDescriptionSl: str("seo_description"), highlightsSl: list("benefits"), technicalSpecifications: specs,
    priceCents: num("price_cents"), supplierPriceCents: num("supplier_price_cents"), supplierPriceMaxCents: num("supplier_price_max_cents"),
    supplierPriceIncludesVat: bool("supplier_price_includes_vat"), supplierPriceSourceName: str("supplier_price_source_name") || null,
    supplierPriceSourceUrl: str("supplier_price_source_url") || null, supplierPriceObservedAt: str("supplier_price_observed_at") || null,
    supplierPriceNoteSl: str("supplier_price_note_sl") || null, compareAtPriceCents: num("compare_at_price_cents"),
    vatRate: num("vat_rate") ?? 22, currency: "EUR", salesMode: row.sales_mode === "buy_now" ? "buy_now" : row.sales_mode === "installation_required" ? "installation_required" : "quote",
    stockStatus: row.stock_status === "in_stock" || row.stock_status === "out_of_stock" || row.stock_status === "backorder" ? row.stock_status : "unverified",
    stockQuantity: num("stock_quantity") ?? 0, leadTimeDays: num("lead_time_days"), householdSizeMin: num("household_size_min"), householdSizeMax: num("household_size_max"),
    resinVolumeLiters: num("resin_volume_liters"), nominalFlowLitersPerMinute: num("nominal_flow_lpm"), maxFlowLitersPerMinute: num("max_flow_lpm"),
    connectionSize: str("connection_size") || null, regenerationMode: str("regeneration_mode") || null, saltConsumptionKg: num("salt_consumption_kg"),
    dimensions: str("dimensions") || null, weightKg: num("weight_kg"), drainRequired: bool("drain_required"), electricityRequired: bool("electricity_required"), bypassIncluded: bool("bypass_included"),
    installationRequired: bool("installation_required") ?? false, warrantyMonths: num("warranty_months"), certifications: list("certifications"),
    technicalDocuments: local?.technicalDocuments ?? [],
    images: databaseProductImages(row).map((image) => ({ url: databaseProductImageUrl(baseUrl, image.storage_path), altSl: image.alt_text || name, width: image.width || undefined, height: image.height || undefined })),
    compatibleAccessories: local?.compatibleAccessories ?? [], compatibleConsumables: local?.compatibleConsumables ?? [],
    featured: bool("featured") ?? false, canonical: `/izdelki/${row.slug}`, createdAt: str("created_at"), updatedAt: str("updated_at"),
  };
}
