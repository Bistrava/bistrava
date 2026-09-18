import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";

import { AdminProductsView } from "@/components/admin/admin-products-view";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import {
  getAdminCatalogMetrics,
} from "@/lib/admin/catalog-dashboard";
import { getAdminCatalogProductsForPage } from "@/lib/admin/catalog-dashboard-repository";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { allCategories, archivedProducts } from "@/lib/catalog/catalog";

export const metadata: Metadata = { title: "Izdelki · Administracija" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const access = await getAdminPageAccess();

  if (access.mode === "not_configured") {
    return (
      <section className="admin-content">
        <div className="admin-panel card">
          <PackageSearch aria-hidden="true" size={36} />
          <p className="section-kicker">Katalog ni povezan</p>
          <h1>Upravljanje izdelkov potrebuje Supabase.</h1>
          <p>
            Lokalni predogled se zaradi varnosti izvaja samo v razvojnem okolju.
          </p>
        </div>
      </section>
    );
  }

  const products = await getAdminCatalogProductsForPage();
  const metrics = getAdminCatalogMetrics(products);
  const categories = [...new Map([
    ...archivedProducts.map((product) => [
      product.sourceCategorySlug,
      { slug: product.sourceCategorySlug, name: product.sourceCategory },
    ] as const),
    ...allCategories.map((category) => [
      category.slug,
      { slug: category.slug, name: category.shortName },
    ] as const),
  ]).values()];

  return (
    <AdminWorkspace access={access} active="products">
      <AdminProductsView
        categories={categories}
        metrics={metrics}
        products={products}
      />
    </AdminWorkspace>
  );
}
