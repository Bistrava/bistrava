import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { InquiriesView } from "@/components/admin/inquiries-view";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function InquiriesPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <p>Supabase ni povezan.</p>;
  const client = await createClient();
  const result = client ? await client.from("quote_requests").select("id,name,email,phone,message,status,internal_note,product_slug,created_at,updated_at").order("created_at", { ascending: false }).limit(100) : null;
  return <AdminWorkspace access={access} active="inquiries"><InquiriesView items={result?.error ? null : result?.data ?? null} canManage={access.mode === "authenticated" && access.role === "admin"} liveEnabled={access.mode === "authenticated"} /></AdminWorkspace>;
}
