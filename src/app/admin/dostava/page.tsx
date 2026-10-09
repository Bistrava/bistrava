import type { Metadata } from "next";
import { AdminShippingView } from "@/components/admin/admin-shipping-view";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getAdminCommerceData, getAdminShippingData } from "@/lib/admin/orders-repository";
import { getAdminPageAccess } from "@/lib/auth/admin-page";

export const metadata: Metadata = { title: "Dostava · Administracija" };
export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <section className="admin-content"><h1>Upravljanje dostave potrebuje Supabase.</h1></section>;
  const [data, commerce] = await Promise.all([getAdminShippingData(), getAdminCommerceData()]);
  return <AdminWorkspace access={access} active="shipping"><AdminShippingView canManage={access.mode === "authenticated" && access.role === "admin" && data.source === "live"} data={data} orders={commerce.orders} /></AdminWorkspace>;
}
