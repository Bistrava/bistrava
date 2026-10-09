import { AdminOverviewView } from "@/components/admin/admin-overview-view";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getAdminOverview } from "@/lib/admin/overview-repository";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { getCheckoutConfig } from "@/lib/commerce/config";
export const dynamic = "force-dynamic";
export default async function AnalyticsPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <p>Supabase ni povezan.</p>;
  return <AdminWorkspace access={access} active="analytics"><AdminOverviewView data={await getAdminOverview()} checkoutEnabled={getCheckoutConfig().enabled} analytics /></AdminWorkspace>;
}
