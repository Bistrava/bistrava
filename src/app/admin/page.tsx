import { AdminOverviewView } from "@/components/admin/admin-overview-view";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getAdminOverview } from "@/lib/admin/overview-repository";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { getCheckoutConfig } from "@/lib/commerce/config";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <section className="admin-content"><h1>Supabase ni povezan.</h1></section>;
  return <AdminWorkspace access={access} active="dashboard"><AdminOverviewView data={await getAdminOverview()} checkoutEnabled={getCheckoutConfig().enabled} /></AdminWorkspace>;
}
