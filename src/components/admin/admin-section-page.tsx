import { Settings } from "lucide-react";

import {
  AdminSectionView,
  type AdminSectionCheck,
  type AdminSectionItem,
  type AdminSectionMetric,
} from "@/components/admin/admin-section-view";
import {
  AdminWorkspace,
  type AdminSectionId,
} from "@/components/admin/admin-workspace";
import { getAdminPageAccess } from "@/lib/auth/admin-page";

type OperationalSectionId = Exclude<AdminSectionId, "dashboard" | "products">;

export async function AdminSectionPage({
  section,
  metrics,
  items,
  checks,
}: {
  section: OperationalSectionId;
  metrics: AdminSectionMetric[];
  items: AdminSectionItem[];
  checks: AdminSectionCheck[];
}) {
  const access = await getAdminPageAccess();

  if (access.mode === "not_configured") {
    return (
      <section className="admin-content">
        <div className="admin-panel card">
          <Settings aria-hidden="true" size={36} />
          <p className="section-kicker">Administracija ni povezana</p>
          <h1>Ta razdelek potrebuje Supabase.</h1>
          <p>Lokalni predogled se zaradi varnosti izvaja samo v razvojnem okolju.</p>
        </div>
      </section>
    );
  }

  return (
    <AdminWorkspace access={access} active={section}>
      <AdminSectionView
        checks={checks}
        isPreview={access.mode === "preview"}
        items={items}
        metrics={metrics}
        section={section}
      />
    </AdminWorkspace>
  );
}
