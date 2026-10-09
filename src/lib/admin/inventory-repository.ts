import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AdminInventoryMovement = { id: string; product: string; sku: string; delta: number; balance: number; reason: string; note: string | null; createdAt: string };

export async function getAdminInventoryMovements(): Promise<AdminInventoryMovement[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("product_inventory_movements")
    .select("id,quantity_delta,balance_after,reason,note,created_at,products(name,name_sl,sku)").order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error("Le journal du stock est momentanément indisponible.");
  return (data as unknown as Array<{ id: string; quantity_delta: number; balance_after: number; reason: string; note: string | null; created_at: string; products: { name: string; name_sl: string | null; sku: string } | null }>).map((row) => ({
    id: row.id, product: row.products?.name_sl || row.products?.name || "—", sku: row.products?.sku || "", delta: row.quantity_delta, balance: row.balance_after, reason: row.reason, note: row.note, createdAt: row.created_at,
  }));
}
