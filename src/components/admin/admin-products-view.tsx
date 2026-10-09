"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import "./product-admin.css";

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
  canEdit = false,
}: {
  categories: Array<{ slug: string; name: string }>;
  metrics: AdminCatalogMetrics;
  products: AdminProductSummary[];
  canEdit?: boolean;
}) {
  const { t, locale } = useAdminLanguage();

  return (
    <>
      <header className="admin-page-heading admin-products-heading">
        <div>
          <p className="section-kicker">{t("products.kicker")}</p>
          <h1>{t("products.title")}</h1>
          <p>{t("products.intro")}</p>
        </div>
        <div className="admin-product-inline-actions">
        {canEdit ? <Link className="button button-primary" href="/admin/izdelki/nov"><Plus size={18} />{locale === "fr" ? "Créer un produit" : "Dodaj izdelek"}</Link> : null}
        <Link className="button button-secondary" href="/mehcalci-vode" target="_blank">
          {t("products.publicCatalog")}
          <ArrowUpRight aria-hidden="true" size={17} />
        </Link>
        </div>
      </header>

      <section aria-label={t("products.summaryAria")} className="admin-catalog-summary">
        <div><strong>{metrics.total}</strong><span>{locale === "fr" ? "Produits" : "Izdelki"}</span></div>
        <div><strong>{metrics.active}</strong><span>{t("products.active")}</span></div>
        <div><strong>{metrics.withSupplierSource}</strong><span>{t("products.sourced")}</span></div>
        <div><strong>{metrics.missingSellingPrice}</strong><span>{t("products.awaitingPrice")}</span></div>
      </section>

      <AdminProductCatalog categories={categories} products={products} />
    </>
  );
}
