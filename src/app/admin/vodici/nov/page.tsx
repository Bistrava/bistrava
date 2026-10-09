import type { Metadata } from "next";
import { AdminGuideEditor } from "@/components/admin/admin-guide-editor";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getAdminPageAccess } from "@/lib/auth/admin-page";

export const metadata: Metadata = { title: "Nov vodnik · Administracija" };
export const dynamic = "force-dynamic";
export default async function NewAdminGuidePage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <section className="admin-content"><h1>Urejanje vodnikov potrebuje Supabase.</h1></section>;
  return <AdminWorkspace access={access} active="guides"><AdminGuideEditor canManage={access.mode === "authenticated" && access.role === "admin"} saved={false} /></AdminWorkspace>;
}
