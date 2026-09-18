"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { useAdminLanguage } from "@/components/admin/admin-i18n";
import { AdminProductCatalog } from "@/components/admin/product-catalog";
import type {
  AdminCatalogMetrics,
  AdminProductSummary,
} from "@/lib/admin/catalog-dashboard";

export function AdminProductsView({
  categories,
  metrics,
  products,
}: {
  categories: Array<{ slug: string; name: string }>;
  metrics: AdminCatalogMetrics;
  products: AdminProductSummary[];
}) {
  const { t } = useAdminLanguage();

  return (
    <>
      <header className="admin-page-heading admin-products-heading">
        <div>
          <p className="section-kicker">{t("products.kicker")}</p>
          <h1>{t("products.title")}</h1>
          <p>{t("products.intro")}</p>
        </div>
        <Link className="button button-secondary" href="/mehcalci-vode" target="_blank">
          {t("products.publicCatalog")}
          <ArrowUpRight aria-hidden="true" size={17} />
        </Link>
      </header>

      <section aria-label={t("products.summaryAria")} className="admin-catalog-summary">
        <div><strong>{metrics.total}</strong><span>{t("products.allDrafts")}</span></div>
        <div><strong>{metrics.active}</strong><span>{t("products.active")}</span></div>
        <div><strong>{metrics.withSupplierSource}</strong><span>{t("products.sourced")}</span></div>
        <div><strong>{metrics.missingSellingPrice}</strong><span>{t("products.awaitingPrice")}</span></div>
      </section>

      <AdminProductCatalog categories={categories} products={products} />
    </>
  );
}
