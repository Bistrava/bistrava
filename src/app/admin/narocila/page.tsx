import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import { AdminOrdersView } from "@/components/admin/admin-orders-view";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getAdminCommerceData } from "@/lib/admin/orders-repository";
import { getAdminPageAccess } from "@/lib/auth/admin-page";

export const metadata: Metadata = { title: "Naročila · Administracija" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const access = await getAdminPageAccess();

  if (access.mode === "not_configured") {
    return (
      <section className="admin-content">
        <div className="admin-panel card">
          <ClipboardList aria-hidden="true" size={36} />
          <p className="section-kicker">Naročila niso povezana</p>
          <h1>Upravljanje naročil potrebuje Supabase.</h1>
          <p>Lokalni predogled uporablja samo fiktivne podatke in deluje izključno v razvojnem okolju.</p>
        </div>
      </section>
    );
  }

  const data = await getAdminCommerceData();

  return (
    <AdminWorkspace access={access} active="orders">
      <AdminOrdersView data={data} />
    </AdminWorkspace>
  );
}
