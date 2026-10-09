import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { activeProducts, catalogProducts } from "@/lib/catalog/catalog";
import { catalogProductSelect, mapDatabaseProduct, type DatabaseCatalogRow } from "@/lib/catalog/database-product";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseConfig } from "@/lib/validation/env";
import type { CatalogProduct } from "@/types/catalog";

export async function getActiveCatalogProducts(): Promise<CatalogProduct[]> {
  const supabase = await createClient();
  const config = getPublicSupabaseConfig();
  if (!supabase || !config) return activeProducts;
  const { data, error } = await supabase.from("products").select(catalogProductSelect)
    .in("status", ["published", "active"]).is("archived_at", null)
    .not("published_at", "is", null).lte("published_at", new Date().toISOString()).order("created_at");
  if (error || !data) throw new Error("Le catalogue Supabase est momentanément indisponible.");
  return (data as unknown as DatabaseCatalogRow[]).map((row) => mapDatabaseProduct(row, config.url, catalogProducts.find((product) => product.sku === row.sku)));
}

export async function getActiveCatalogProduct(slug: string) {
  return (await getActiveCatalogProducts()).find((product) => product.slug === slug);
}

export async function getStorefrontCatalogProducts(): Promise<CatalogProduct[]> {
  // An intentionally empty live catalogue must not resurrect archived imported products.
  if (getPublicSupabaseConfig()) return getActiveCatalogProducts();
  return catalogProducts;
}

export async function getIndexableProductSlugs(): Promise<string[]> {
  const config = getPublicSupabaseConfig();
  if (!config) return activeProducts.map((product) => product.slug);
  const supabase = createSupabaseClient(config.url, config.publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await supabase.from("products").select("slug").in("status", ["published", "active"])
    .is("archived_at", null).not("published_at", "is", null).lte("published_at", new Date().toISOString());
  return error || !data ? [] : data.map((row) => row.slug).filter((slug): slug is string => Boolean(slug));
}
