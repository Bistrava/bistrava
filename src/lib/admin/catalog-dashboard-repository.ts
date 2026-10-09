import "server-only";
import { getAdminCatalogProducts, type AdminProductSummary } from "@/lib/admin/catalog-dashboard";
import { catalogProducts } from "@/lib/catalog/catalog";
import { catalogProductSelect, mapDatabaseProduct, type DatabaseCatalogRow } from "@/lib/catalog/database-product";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseConfig } from "@/lib/validation/env";

export async function getAdminCatalogProductsForPage(): Promise<AdminProductSummary[]> {
  const supabase = await createClient();
  const config = getPublicSupabaseConfig();
  if (!supabase || !config) return getAdminCatalogProducts(catalogProducts);
  const { data, error } = await supabase.from("products").select(catalogProductSelect).order("created_at", { ascending: false });
  if (error) throw new Error("Le catalogue Supabase est momentanément indisponible. Rechargez la page.");
  return getAdminCatalogProducts((data as unknown as DatabaseCatalogRow[]).map((row) => mapDatabaseProduct(row, config.url, catalogProducts.find((p) => p.sku === row.sku))));
}
