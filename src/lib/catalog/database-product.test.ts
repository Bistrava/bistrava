import { describe, expect, it } from "vitest";
import { mapDatabaseProduct, type DatabaseCatalogRow } from "@/lib/catalog/database-product";

const row: DatabaseCatalogRow = {
  id: "77e8bebf-6b35-41d4-bdc8-186ef83fdb05", slug: "nov-filter", sku: "NEW-001", name: "Nov filter", brand: "Test", name_sl: "Novi vodni filter", status: "active",
  price_cents: 3490, stock_quantity: 15, stock_status: "in_stock", sales_mode: "buy_now", seo_title: "Novi filter za vodo | Bistrava", seo_description: "Opis za iskalnike",
  product_categories: [{ sort_order: 0, categories: { slug: "ciljna-zascita", name: "Zaščita naprav" } }],
  product_images: [{ storage_path: "new/photo 1.webp", alt_text: "Filter", sort_order: 1, is_primary: false }, { storage_path: "new/main.webp", alt_text: "Glavna slika", sort_order: 2, is_primary: true }],
};

describe("database catalogue mapping", () => {
  it("publishes admin-created products without any local seed entry", () => {
    const product = mapDatabaseProduct(row, "https://project.supabase.co");
    expect(product).toMatchObject({ id: row.id, sku: "NEW-001", nameSl: "Novi vodni filter", categorySlug: "ciljna-zascita", priceCents: 3490, stockQuantity: 15, status: "active", seoTitle: "Novi filter za vodo | Bistrava", canonical: "/izdelki/nov-filter" });
    expect(product.images[0].url).toBe("https://project.supabase.co/storage/v1/object/public/product-media/new/main.webp");
    expect(product.images[1].url).toContain("photo%201.webp");
  });
  it("keeps archived, empty-stock and absent-price fields authoritative", () => {
    const product = mapDatabaseProduct({ ...row, status: "archived", price_cents: null, stock_quantity: 0, stock_status: "out_of_stock", product_images: [] }, "https://project.supabase.co");
    expect(product).toMatchObject({ status: "archived", priceCents: null, stockQuantity: 0, stockStatus: "out_of_stock", images: [] });
  });
});
