import type { Metadata } from "next";
import { AdminGuidesView } from "@/components/admin/admin-guides-view";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getAdminGuides } from "@/lib/content/guides-repository";
import { getAdminPageAccess } from "@/lib/auth/admin-page";

export const metadata: Metadata = { title: "Vodiči · Administracija" };
export const dynamic = "force-dynamic";
export default async function AdminGuidesPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <section className="admin-content"><h1>Urejanje vodnikov potrebuje Supabase.</h1></section>;
  const data = await getAdminGuides();
  return <AdminWorkspace access={access} active="guides"><AdminGuidesView available={data.source === "live"} canManage={access.mode === "authenticated" && access.role === "admin" && data.source === "live"} guides={data.guides} /></AdminWorkspace>;
}
