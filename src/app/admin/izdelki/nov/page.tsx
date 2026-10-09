import type { Metadata } from "next";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { AdminProductEditor } from "@/components/admin/product-editor";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { createEmptyAdminProduct } from "@/lib/admin/product-editor";

export const metadata: Metadata = { title: "Nov izdelek · Administracija" };
export const dynamic = "force-dynamic";

export default async function NewAdminProductPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <section className="admin-content"><h1>Supabase ni povezan.</h1></section>;
  return <AdminWorkspace access={access} active="products"><AdminProductEditor accessMode={access.mode} product={createEmptyAdminProduct()} canEdit={access.mode === "authenticated" && access.role === "admin"} /></AdminWorkspace>;
}
