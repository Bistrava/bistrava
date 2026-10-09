import "server-only";
import { createAdminProductEditorData, type AdminProductEditorData } from "@/lib/admin/product-editor";
import { catalogProducts, getCatalogCategory, getCatalogProduct } from "@/lib/catalog/catalog";
import { catalogProductSelect, databaseProductCategory, databaseProductImages, databaseProductImageUrl, mapDatabaseProduct, type DatabaseCatalogRow } from "@/lib/catalog/database-product";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseConfig } from "@/lib/validation/env";

export async function getAdminProductEditorData(slug: string): Promise<AdminProductEditorData | undefined> {
  const supabase = await createClient();
  const config = getPublicSupabaseConfig();
  if (!supabase || !config) {
    const local = getCatalogProduct(slug);
    return local ? createAdminProductEditorData(local, getCatalogCategory(local.categorySlug)?.shortName ?? local.categorySlug) : undefined;
  }
  const { data, error } = await supabase.from("products").select(catalogProductSelect).eq("slug", slug).maybeSingle();
  if (error) throw new Error("Le produit ne peut pas être chargé. Rechargez la page.");
  if (!data) return undefined;
  const row = data as unknown as DatabaseCatalogRow;
  const product = mapDatabaseProduct(row, config.url, catalogProducts.find((p) => p.sku === row.sku));
  const base = createAdminProductEditorData(product, databaseProductCategory(row)?.name ?? getCatalogCategory(product.categorySlug)?.name ?? product.categorySlug);
  base.values.tags = Array.isArray(row.tags) ? row.tags.join(", ") : "";
  base.documentCount = row.product_documents?.length ?? 0;
  base.images = databaseProductImages(row).map((image) => ({ id: image.id!, url: databaseProductImageUrl(config.url, image.storage_path), alt: image.alt_text, isPrimary: image.is_primary }));
  return base;
}
