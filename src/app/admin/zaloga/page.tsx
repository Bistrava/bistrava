import type { Metadata } from "next";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { AdminInventoryView } from "@/components/admin/admin-inventory-view";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { getAdminCatalogProductsForPage } from "@/lib/admin/catalog-dashboard-repository";
import { getAdminInventoryMovements } from "@/lib/admin/inventory-repository";
export const metadata: Metadata = { title: "Zaloga · Administracija" };
export const dynamic = "force-dynamic";
export default async function AdminInventoryPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <section className="admin-content"><h1>Supabase ni povezan.</h1></section>;
  const [products, movements] = await Promise.all([getAdminCatalogProductsForPage(), getAdminInventoryMovements()]);
  return <AdminWorkspace access={access} active="inventory"><AdminInventoryView products={products} movements={movements} canEdit={access.mode === "authenticated" && access.role === "admin"} /></AdminWorkspace>;
}
