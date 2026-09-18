import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminAccess =
  | { status: "not_configured" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; email?: string }
  | { status: "authorized"; userId: string; email?: string; role: "admin" | "editor" };

export async function getAdminAccess(): Promise<AdminAccess> {
  const supabase = await createClient();
  if (!supabase) return { status: "not_configured" };

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : undefined;

  if (error || !userId) return { status: "unauthenticated" };

  const email =
    claims && typeof claims.email === "string" ? claims.email : undefined;
  const { data: roleRecord, error: roleError } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("profile_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (roleError || !roleRecord) return { status: "forbidden", email };

  const role = roleRecord.role === "editor" ? "editor" : "admin";
  return { status: "authorized", userId, email, role };
}
