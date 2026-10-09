import type { Metadata } from "next";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { AdminPromotionsView } from "@/components/admin/admin-promotions-view";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { getAdminPromotions } from "@/lib/admin/promotions-repository";

export const metadata: Metadata = { title: "Promocije · Administracija" };
export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <section className="admin-content"><div className="card admin-panel"><h1>Promocije</h1><p>Za upravljanje promocij povežite Supabase.</p></div></section>;
  const data = await getAdminPromotions();
  return <AdminWorkspace access={access} active="promotions"><AdminPromotionsView data={data} canEdit={access.mode === "authenticated" && access.role === "admin"} /></AdminWorkspace>;
}
