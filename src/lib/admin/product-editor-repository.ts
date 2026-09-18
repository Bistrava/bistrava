import "server-only";

import {
  createAdminProductEditorData,
  type AdminProductEditorData,
} from "@/lib/admin/product-editor";
import {
  catalogProducts,
  getCatalogCategory,
  getCatalogProduct,
} from "@/lib/catalog/catalog";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseConfig } from "@/lib/validation/env";
import type { CatalogProduct } from "@/types/catalog";

type ProductRow = {
  slug: string;
  name: string;
  name_sl: string | null;
  brand: string;
  sku: string | null;
  technology: string | null;
  status: "draft" | "published" | "active" | "archived";
  sales_mode: CatalogProduct["salesMode"];
  featured: boolean;
  short_description: string;
  short_description_sl: string | null;
  description: string | null;
  description_sl: string | null;
  benefits: unknown;
  seo_title: string | null;
  seo_description: string | null;
  primary_keyword: string | null;
  secondary_keywords: unknown;
  long_tail_keywords: unknown;
  tags: unknown;
  price_cents: number | null;
  compare_at_price_cents: number | null;
  vat_rate: number | string;
  stock_status: CatalogProduct["stockStatus"];
  stock_quantity: number;
  lead_time_days: number | null;
  warranty_months: number | null;
  household_size_min: number | null;
  household_size_max: number | null;
  resin_volume_liters: number | string | null;
  nominal_flow_lpm: number | string | null;
  max_flow_lpm: number | string | null;
  connection_size: string | null;
  regeneration_mode: string | null;
  salt_consumption_kg: number | string | null;
  dimensions: string | null;
  weight_kg: number | string | null;
  drain_required: boolean | null;
  electricity_required: boolean | null;
  bypass_included: boolean | null;
  installation_required: boolean;
  technical_specs: unknown;
  certifications: unknown;
  supplier_price_cents: number | null;
  supplier_price_source_name: string | null;
  supplier_price_source_url: string | null;
  updated_at: string;
  product_images: Array<{
    storage_path: string;
    alt_text: string;
    sort_order: number;
    is_primary: boolean;
  }>;
  product_documents: Array<{ id: string }>;
};

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function optional(value: number | string | null) {
  return value === null ? "" : String(value);
}

function money(value: number | null) {
  return value === null ? "" : (value / 100).toFixed(2);
}

function optionalBoolean(value: boolean | null): "" | "true" | "false" {
  return value === null ? "" : value ? "true" : "false";
}

function technicalSpecifications(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("labelSl" in item) ||
      !("valueSl" in item) ||
      typeof item.labelSl !== "string" ||
      typeof item.valueSl !== "string"
    ) return [];
    return [`${item.labelSl} | ${item.valueSl}`];
  }).join("\n");
}

export async function getAdminProductEditorData(
  slug: string,
): Promise<AdminProductEditorData | undefined> {
  const localBySlug = getCatalogProduct(slug);
  const supabase = await createClient();

  if (!supabase) {
    if (!localBySlug) return undefined;
    const category = getCatalogCategory(localBySlug.categorySlug);
    return createAdminProductEditorData(
      localBySlug,
      localBySlug.status === "archived"
        ? localBySlug.sourceCategory
        : category?.shortName ?? localBySlug.categorySlug,
    );
  }

  const { data, error } = await supabase
    .from("products")
    .select("slug,name,name_sl,brand,sku,technology,status,sales_mode,featured,short_description,short_description_sl,description,description_sl,benefits,seo_title,seo_description,primary_keyword,secondary_keywords,long_tail_keywords,tags,price_cents,compare_at_price_cents,vat_rate,stock_status,stock_quantity,lead_time_days,warranty_months,household_size_min,household_size_max,resin_volume_liters,nominal_flow_lpm,max_flow_lpm,connection_size,regeneration_mode,salt_consumption_kg,dimensions,weight_kg,drain_required,electricity_required,bypass_included,installation_required,technical_specs,certifications,supplier_price_cents,supplier_price_source_name,supplier_price_source_url,updated_at,product_images(storage_path,alt_text,sort_order,is_primary),product_documents(id)")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    if (!localBySlug) return undefined;
    const category = getCatalogCategory(localBySlug.categorySlug);
    return createAdminProductEditorData(
      localBySlug,
      localBySlug.status === "archived"
        ? localBySlug.sourceCategory
        : category?.shortName ?? localBySlug.categorySlug,
    );
  }

  const row = data as ProductRow;
  const local = localBySlug ?? catalogProducts.find((product) => product.sku === row.sku);
  if (!local) return undefined;
  const category = getCatalogCategory(local.categorySlug);
  const base = createAdminProductEditorData(
    local,
    local.status === "archived"
      ? local.sourceCategory
      : category?.shortName ?? local.categorySlug,
  );
  const images = [...row.product_images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const config = getPublicSupabaseConfig();
  const firstImage = images[0];

  return {
    ...base,
    values: {
      currentSlug: row.slug,
      nameSl: row.name_sl || row.name,
      slug: row.slug,
      brand: row.brand,
      sku: row.sku || local.sku,
      technology: row.technology ?? "",
      status: row.status === "published" ? "active" : row.status,
      salesMode: row.sales_mode,
      featured: row.featured ? "true" : "false",
      shortDescriptionSl: row.short_description_sl || row.short_description,
      descriptionSl: row.description_sl || row.description || "",
      highlights: stringArray(row.benefits).join("\n"),
      seoTitle: row.seo_title ?? "",
      seoDescriptionSl: row.seo_description ?? "",
      primaryKeyword: row.primary_keyword ?? local.primaryKeyword,
      secondaryKeywords: stringArray(row.secondary_keywords).join(", "),
      longTailKeywords: stringArray(row.long_tail_keywords).join(", "),
      tags: stringArray(row.tags).join(", "),
      priceEuros: money(row.price_cents),
      compareAtPriceEuros: money(row.compare_at_price_cents),
      vatRate: String(row.vat_rate),
      stockStatus: row.stock_status,
      stockQuantity: String(row.stock_quantity),
      leadTimeDays: optional(row.lead_time_days),
      warrantyMonths: optional(row.warranty_months),
      householdSizeMin: optional(row.household_size_min),
      householdSizeMax: optional(row.household_size_max),
      resinVolumeLiters: optional(row.resin_volume_liters),
      nominalFlowLitersPerMinute: optional(row.nominal_flow_lpm),
      maxFlowLitersPerMinute: optional(row.max_flow_lpm),
      connectionSize: row.connection_size ?? "",
      regenerationMode: row.regeneration_mode ?? "",
      saltConsumptionKg: optional(row.salt_consumption_kg),
      dimensions: row.dimensions ?? "",
      weightKg: optional(row.weight_kg),
      drainRequired: optionalBoolean(row.drain_required),
      electricityRequired: optionalBoolean(row.electricity_required),
      bypassIncluded: optionalBoolean(row.bypass_included),
      installationRequired: row.installation_required ? "true" : "false",
      technicalSpecifications: technicalSpecifications(row.technical_specs),
      certifications: stringArray(row.certifications).join("\n"),
    },
    image: firstImage && config
      ? {
          url: `${config.url}/storage/v1/object/public/product-media/${firstImage.storage_path
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`,
          alt: firstImage.alt_text,
        }
      : base.image,
    imageCount: images.length,
    documentCount: row.product_documents.length,
    supplierPriceCents: row.supplier_price_cents,
    supplierPriceSourceName: row.supplier_price_source_name,
    supplierPriceSourceUrl: row.supplier_price_source_url,
    updatedAt: row.updated_at,
  };
}
