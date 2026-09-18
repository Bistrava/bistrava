import "server-only";

import {
  getAdminCatalogProducts,
  type AdminProductSummary,
  type ProductReadinessCheckId,
} from "@/lib/admin/catalog-dashboard";
import {
  catalogProducts,
  getCatalogCategory,
} from "@/lib/catalog/catalog";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseConfig } from "@/lib/validation/env";
import type { CatalogProduct } from "@/types/catalog";

type SummaryRow = {
  slug: string;
  sku: string | null;
  name: string;
  name_sl: string | null;
  brand: string;
  status: "draft" | "published" | "active" | "archived";
  sales_mode: CatalogProduct["salesMode"];
  stock_status: CatalogProduct["stockStatus"];
  stock_quantity: number;
  price_cents: number | null;
  supplier_price_cents: number | null;
  supplier_price_source_url: string | null;
  description_sl: string | null;
  seo_description: string | null;
  technical_specs: unknown;
  lead_time_days: number | null;
  warranty_months: number | null;
  product_images: Array<{
    storage_path: string;
    alt_text: string;
    sort_order: number;
    is_primary: boolean;
  }>;
  product_documents: Array<{ id: string }>;
};

function readiness(row: SummaryRow) {
  const checks: Array<{ id: ProductReadinessCheckId; complete: boolean }> = [
    { id: "content", complete: Boolean(row.description_sl?.trim() && row.seo_description?.trim()) },
    { id: "gallery", complete: row.product_images.length >= 4 },
    { id: "technicalSpecifications", complete: Array.isArray(row.technical_specs) && row.technical_specs.length > 0 },
    { id: "supplierSource", complete: row.supplier_price_cents !== null && Boolean(row.supplier_price_source_url) },
    { id: "sellingPrice", complete: row.price_cents !== null },
    { id: "publicStock", complete: row.stock_status !== "unverified" },
    { id: "leadTime", complete: row.lead_time_days !== null },
    { id: "warranty", complete: row.warranty_months !== null },
    { id: "technicalDocuments", complete: row.product_documents.length > 0 },
  ];
  const completed = checks.filter((check) => check.complete).length;
  return {
    completed,
    total: checks.length,
    percentage: Math.round((completed / checks.length) * 100),
    missing: checks.filter((check) => !check.complete).map((check) => check.id),
  };
}

export async function getAdminCatalogProductsForPage(): Promise<AdminProductSummary[]> {
  const fallback = getAdminCatalogProducts(catalogProducts);
  const fallbackBySku = new Map(fallback.map((product) => [product.sku, product]));
  const supabase = await createClient();
  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from("products")
    .select("slug,sku,name,name_sl,brand,status,sales_mode,stock_status,stock_quantity,price_cents,supplier_price_cents,supplier_price_source_url,description_sl,seo_description,technical_specs,lead_time_days,warranty_months,product_images(storage_path,alt_text,sort_order,is_primary),product_documents(id)")
    .in("sku", catalogProducts.map((product) => product.sku));

  if (error || !data) return fallback;
  const rows = data as SummaryRow[];
  const rowsBySku = new Map(rows.map((row) => [row.sku, row]));
  const config = getPublicSupabaseConfig();

  return catalogProducts.map((local) => {
    const row = rowsBySku.get(local.sku);
    if (!row) return fallbackBySku.get(local.sku)!;
    const firstImage = [...row.product_images].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    )[0];
    return {
      sku: row.sku || local.sku,
      slug: row.slug,
      name: row.name_sl || row.name,
      brand: row.brand,
      categorySlug: local.status === "archived" ? local.sourceCategorySlug : local.categorySlug,
      categoryName: local.status === "archived"
        ? local.sourceCategory
        : getCatalogCategory(local.categorySlug)?.shortName ?? local.categorySlug,
      status: row.status === "published" ? "active" : row.status,
      salesMode: row.sales_mode,
      stockStatus: row.stock_status,
      stockQuantity: row.stock_quantity,
      priceCents: row.price_cents,
      supplierPriceCents: row.supplier_price_cents,
      image: firstImage && config
        ? {
            url: `${config.url}/storage/v1/object/public/product-media/${firstImage.storage_path
              .split("/")
              .map(encodeURIComponent)
              .join("/")}`,
            alt: firstImage.alt_text,
          }
        : local.images[0]
          ? { url: local.images[0].url, alt: local.images[0].altSl }
          : null,
      readiness: readiness(row),
    };
  });
}
