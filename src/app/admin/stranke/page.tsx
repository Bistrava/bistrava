import type { Metadata } from "next";
import { AdminOrdersView } from "@/components/admin/admin-orders-view";
import { CustomerEditor } from "@/components/admin/customer-editor";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getAdminCommerceData } from "@/lib/admin/orders-repository";
import { getAdminPageAccess } from "@/lib/auth/admin-page";

export const metadata: Metadata = { title: "Kupci · Administracija" };
export const dynamic = "force-dynamic";
export default async function CustomersPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <p>Supabase ni povezan.</p>;
  const data = await getAdminCommerceData();
  const canManage = access.mode === "authenticated" && access.role === "admin";
  return <AdminWorkspace access={access} active="customers"><AdminOrdersView data={data} initialView="customers" canManage={canManage} />{canManage && data.source === "live" ? <CustomerEditor profiles={data.profiles} /> : null}</AdminWorkspace>;
}
