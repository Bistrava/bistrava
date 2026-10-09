import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { ActivityView } from "@/components/admin/activity-view";
import { getAdminActivity } from "@/lib/admin/activity-repository";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
export const dynamic = "force-dynamic";
export default async function ActivityPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <p>Supabase ni povezan.</p>;
  return <AdminWorkspace access={access} active="activity"><ActivityView entries={await getAdminActivity()} /></AdminWorkspace>;
}
