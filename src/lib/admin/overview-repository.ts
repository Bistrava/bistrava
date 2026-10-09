import "server-only";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminOverview } from "./overview";
export async function getAdminOverview(): Promise<AdminOverview | null> {
  const access = await getAdminAccess();
  if (access.status !== "authorized") return null;
  const client = await createClient();
  if (!client) return null;
  const { data, error } = await client.rpc("get_admin_overview");
  if (error || !data) return null;
  return data as AdminOverview;
}
