import "server-only";

import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminPromotion } from "./promotions";

export async function getAdminPromotions(): Promise<{ promotions: AdminPromotion[]; connected: boolean }> {
  const access = await getAdminAccess();
  if (access.status !== "authorized") return { promotions: [], connected: false };
  const supabase = await createClient();
  if (!supabase) return { promotions: [], connected: false };
  const { data, error } = await supabase.from("discounts")
    .select("id,name,description,discount_type,value,active,starts_at,ends_at,minimum_order_cents,usage_limit,used_count,updated_at,archived_at,discount_codes(id,code,active,usage_limit,used_count)")
    .order("created_at", { ascending: false }).limit(500);
  if (error || !data) return { promotions: [], connected: false };
  return { connected: true, promotions: data.map((item) => ({
    id: item.id, name: item.name, description: item.description, type: item.discount_type,
    value: item.value, active: item.active, startsAt: item.starts_at, endsAt: item.ends_at,
    minimumOrderCents: item.minimum_order_cents, usageLimit: item.usage_limit,
    usedCount: item.used_count, updatedAt: item.updated_at, archivedAt: item.archived_at,
    codes: (item.discount_codes ?? []).map((code) => ({
      id: code.id, code: code.code, active: code.active, usageLimit: code.usage_limit, usedCount: code.used_count,
    })).sort((a, b) => a.code.localeCompare(b.code)),
  })) };
}
