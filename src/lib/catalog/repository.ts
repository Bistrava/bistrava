import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { activeProducts, specialistProducts } from "@/lib/catalog/catalog";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseConfig } from "@/lib/validation/env";
import type { CatalogProduct } from "@/types/catalog";

type PublicProductRow = {
  slug: string;
  sku: string | null;
  status: "published" | "active";
  name_sl: string | null;
  short_description_sl: string | null;
  description_sl: string | null;
  seo_description: string | null;
  benefits: unknown;
  technical_specs: unknown;
  price_cents: number | null;
  supplier_price_cents: number | null;
  supplier_price_max_cents: number | null;
  supplier_price_includes_vat: boolean | null;
  supplier_price_source_name: string | null;
  supplier_price_source_url: string | null;
  supplier_price_observed_at: string | null;
  supplier_price_note_sl: string | null;
  compare_at_price_cents: number | null;
  vat_rate: number;
  currency: "EUR";
  sales_mode: CatalogProduct["salesMode"];
  stock_status: CatalogProduct["stockStatus"];
  stock_quantity: number;
  lead_time_days: number | null;
  household_size_min: number | null;
  household_size_max: number | null;
  resin_volume_liters: number | null;
  nominal_flow_lpm: number | null;
  max_flow_lpm: number | null;
  connection_size: string | null;
  regeneration_mode: string | null;
  salt_consumption_kg: number | null;
  dimensions: string | null;
  weight_kg: number | null;
  drain_required: boolean | null;
  electricity_required: boolean | null;
  bypass_included: boolean | null;
  installation_required: boolean;
  warranty_months: number | null;
  certifications: unknown;
  featured: boolean;
  canonical_url: string | null;
  published_at: string;
  updated_at: string;
  product_images: Array<{
    storage_path: string;
    alt_text: string;
    width: number | null;
    height: number | null;
    sort_order: number;
    is_primary: boolean;
  }>;
};

function nullableNumber(value: number | null) {
  return value === null ? null : Number(value);
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function technicalSpecifications(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("labelSl" in item) ||
      !("valueSl" in item) ||
      typeof item.labelSl !== "string" ||
      typeof item.valueSl !== "string"
    ) {
      return [];
    }
    return [{ labelSl: item.labelSl, valueSl: item.valueSl }];
  });
}

/**
 * Supabase is the primary source of public activation, price and availability.
 * The reviewed local catalog remains a build-safe fallback when credentials or
 * migrations are not available, and contains no active products by default.
 */
export async function getActiveCatalogProducts(): Promise<CatalogProduct[]> {
  const supabase = await createClient();
  if (!supabase) return activeProducts;

  const { data, error } = await supabase
    .from("products")
    .select(
      "slug,sku,status,name_sl,short_description_sl,description_sl,seo_description,benefits,technical_specs,price_cents,supplier_price_cents,supplier_price_max_cents,supplier_price_includes_vat,supplier_price_source_name,supplier_price_source_url,supplier_price_observed_at,supplier_price_note_sl,compare_at_price_cents,vat_rate,currency,sales_mode,stock_status,stock_quantity,lead_time_days,household_size_min,household_size_max,resin_volume_liters,nominal_flow_lpm,max_flow_lpm,connection_size,regeneration_mode,salt_consumption_kg,dimensions,weight_kg,drain_required,electricity_required,bypass_included,installation_required,warranty_months,certifications,featured,canonical_url,published_at,updated_at,product_images(storage_path,alt_text,width,height,sort_order,is_primary)",
    )
    .in("status", ["published", "active"])
    .is("archived_at", null)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString());

  if (error || !data) return activeProducts;
  const rows = data as PublicProductRow[];
  const config = getPublicSupabaseConfig();

  return rows.flatMap((row) => {
    const local = specialistProducts.find(
      (product) => product.slug === row.slug || product.sku === row.sku,
    );
    if (!local) return [];
    return [
      {
        ...local,
        slug: row.slug,
        status: "active" as const,
        nameSl: row.name_sl || local.nameSl,
        shortDescriptionSl: row.short_description_sl || local.shortDescriptionSl,
        descriptionSl: row.description_sl || local.descriptionSl,
        seoDescriptionSl: row.seo_description || local.seoDescriptionSl,
        highlightsSl: stringArray(row.benefits),
        technicalSpecifications: technicalSpecifications(row.technical_specs),
        priceCents: row.price_cents,
        supplierPriceCents:
          row.supplier_price_cents ?? local.supplierPriceCents,
        supplierPriceMaxCents:
          row.supplier_price_max_cents ?? local.supplierPriceMaxCents,
        supplierPriceIncludesVat:
          row.supplier_price_includes_vat ?? local.supplierPriceIncludesVat,
        supplierPriceSourceName:
          row.supplier_price_source_name ?? local.supplierPriceSourceName,
        supplierPriceSourceUrl:
          row.supplier_price_source_url ?? local.supplierPriceSourceUrl,
        supplierPriceObservedAt:
          row.supplier_price_observed_at ?? local.supplierPriceObservedAt,
        supplierPriceNoteSl:
          row.supplier_price_note_sl ?? local.supplierPriceNoteSl,
        compareAtPriceCents: row.compare_at_price_cents,
        vatRate: Number(row.vat_rate),
        currency: row.currency,
        salesMode: row.sales_mode,
        stockStatus: row.stock_status,
        stockQuantity: row.stock_quantity,
        leadTimeDays: row.lead_time_days,
        householdSizeMin: row.household_size_min,
        householdSizeMax: row.household_size_max,
        resinVolumeLiters: nullableNumber(row.resin_volume_liters),
        nominalFlowLitersPerMinute: nullableNumber(row.nominal_flow_lpm),
        maxFlowLitersPerMinute: nullableNumber(row.max_flow_lpm),
        connectionSize: row.connection_size,
        regenerationMode: row.regeneration_mode,
        saltConsumptionKg: nullableNumber(row.salt_consumption_kg),
        dimensions: row.dimensions,
        weightKg: nullableNumber(row.weight_kg),
        drainRequired: row.drain_required,
        electricityRequired: row.electricity_required,
        bypassIncluded: row.bypass_included,
        installationRequired: row.installation_required,
        warrantyMonths: row.warranty_months,
        certifications: stringArray(row.certifications),
        featured: row.featured,
        canonical: row.canonical_url || `/izdelki/${row.slug}`,
        images: config
          ? [...row.product_images]
              .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
              .map((image) => ({
                url: `${config.url}/storage/v1/object/public/product-media/${image.storage_path
                  .split("/")
                  .map(encodeURIComponent)
                  .join("/")}`,
                altSl: image.alt_text,
                width: image.width || undefined,
                height: image.height || undefined,
              }))
          : [],
        updatedAt: row.updated_at,
      },
    ];
  });
}

export async function getActiveCatalogProduct(slug: string) {
  const products = await getActiveCatalogProducts();
  return products.find((product) => product.slug === slug);
}

export async function getIndexableProductSlugs(): Promise<string[]> {
  const config = getPublicSupabaseConfig();
  if (!config) return activeProducts.map((product) => product.slug);
  const supabase = createSupabaseClient(config.url, config.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .in("status", ["published", "active"])
    .is("archived_at", null)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString());
  if (error || !data) return [];
  return data.map((row) => row.slug).filter((slug): slug is string => Boolean(slug));
}
