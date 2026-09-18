import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import {
  getAdminCatalogMetrics,
  getAdminCatalogProducts,
} from "@/lib/admin/catalog-dashboard";
import { getAdminPageAccess } from "@/lib/auth/admin-page";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await getAdminPageAccess();

  if (access.mode === "not_configured") {
    return (
      <section className="admin-content">
        <div className="admin-panel card">
          <p className="section-kicker">Konfiguracija je varno ustavljena</p>
          <h1>Administracija še ni povezana.</h1>
          <p>
            Brez veljavnih Supabase spremenljivk se podatki ne nalagajo in
            prijava ni mogoča. Lokalni predogled je na voljo samo med razvojem.
          </p>
          <div className="notice">
            Nastavite <code>NEXT_PUBLIC_SUPABASE_URL</code> in{" "}
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, nato uporabite
            ročni postopek za prvega skrbnika.
          </div>
        </div>
      </section>
    );
  }

  const products = getAdminCatalogProducts();
  const metrics = getAdminCatalogMetrics(products);
  const priorityProducts = [...products]
    .sort((left, right) => left.readiness.percentage - right.readiness.percentage)
    .slice(0, 5);
  const services = [
    { id: "supabase", connected: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    { id: "resend", connected: Boolean(process.env.RESEND_API_KEY) },
    { id: "vercel", connected: Boolean(process.env.VERCEL) },
  ] as const;

  return (
    <AdminWorkspace access={access} active="dashboard">
      <AdminDashboard
        isPreview={access.mode === "preview"}
        metrics={metrics}
        priorityProducts={priorityProducts}
        services={[...services]}
      />
    </AdminWorkspace>
  );
}
