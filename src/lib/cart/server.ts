import "server-only";

import { connection } from "next/server";

import type { CartCatalogSnapshot, CartProductSnapshot } from "@/lib/cart/cart";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseConfig } from "@/lib/validation/env";

/** A failed read is explicitly different from a successful, empty catalog. */
export async function getCartCatalogSnapshot(): Promise<CartCatalogSnapshot> {
  await connection();
  try {
    const supabase = await createClient();
    const config = getPublicSupabaseConfig();
    if (!supabase || !config) return { verified: false, products: [] };

    const { data, error } = await supabase
      .from("products")
      .select("sku,slug,name_sl,price_cents,stock_quantity,product_images(storage_path,alt_text,sort_order,is_primary)")
      .in("status", ["published", "active"])
      .is("archived_at", null)
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .eq("sales_mode", "buy_now")
      .eq("stock_status", "in_stock")
      .gt("price_cents", 0)
      .gt("stock_quantity", 0)
      .limit(1000)
      .abortSignal(AbortSignal.timeout(8000));

    // Never remove cart lines based on a failed or potentially truncated response.
    if (error || !data || data.length >= 1000) return { verified: false, products: [] };
    if (data.some((row) => !row.sku || !row.slug || !row.name_sl ||
      !Number.isInteger(row.price_cents) || !Number.isInteger(row.stock_quantity))) {
      return { verified: false, products: [] };
    }

    const products: CartProductSnapshot[] = data.map((row) => {
      const image = [...row.product_images].sort((a, b) =>
        Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      )[0];
      return {
        sku: row.sku,
        slug: row.slug,
        nameSl: row.name_sl,
        unitPriceCents: row.price_cents,
        stockQuantity: row.stock_quantity,
        imageUrl: image ? `${config.url}/storage/v1/object/public/product-media/${image.storage_path
          .split("/").map(encodeURIComponent).join("/")}` : null,
        imageAltSl: image?.alt_text || row.name_sl,
      };
    });
    return { verified: true, products };
  } catch {
    return { verified: false, products: [] };
  }
}
