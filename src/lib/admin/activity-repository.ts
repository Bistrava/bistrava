import "server-only";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export type ActivityEntry = { id: string; action: string; entity_type: string; entity_id: string | null; created_at: string; actor: string };
export async function getAdminActivity() {
  if ((await getAdminAccess()).status !== "authorized") return null;
  const client = await createClient(); if (!client) return null;
  const { data, error } = await client.from("audit_logs").select("id,action,entity_type,entity_id,created_at,profiles!audit_logs_actor_id_fkey(full_name,email)").order("created_at", { ascending: false }).limit(100);
  if (error) return null;
  return data.map(row => { const actor = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles; return { id: row.id, action: row.action, entity_type: row.entity_type, entity_id: row.entity_id, created_at: row.created_at, actor: actor?.full_name || actor?.email || "System" }; }) as ActivityEntry[];
}
