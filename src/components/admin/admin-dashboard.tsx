"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Cloud,
  Database,
  Mail,
  PackageCheck,
  PackageSearch,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import {
  getReadinessTranslationKey,
  useAdminLanguage,
} from "@/components/admin/admin-i18n";
import type {
  AdminCatalogMetrics,
  AdminProductSummary,
} from "@/lib/admin/catalog-dashboard";

export type AdminServiceConnection = {
  id: "supabase" | "resend" | "vercel";
  connected: boolean;
};

const servicePresentation = {
  supabase: {
    icon: Database,
    nameKey: "service.supabase.name",
    detailKey: "service.supabase.detail",
  },
  resend: {
    icon: Mail,
    nameKey: "service.resend.name",
    detailKey: "service.resend.detail",
  },
  vercel: {
    icon: Cloud,
    nameKey: "service.vercel.name",
    detailKey: "service.vercel.detail",
  },
} as const;

export function AdminDashboard({
  isPreview,
  metrics,
  priorityProducts,
  services,
}: {
  isPreview: boolean;
  metrics: AdminCatalogMetrics;
  priorityProducts: AdminProductSummary[];
  services: AdminServiceConnection[];
}) {
  const { t } = useAdminLanguage();

  return (
    <>
      {isPreview ? (
        <div className="admin-preview-banner" role="status">
          <Sparkles aria-hidden="true" size={19} />
          <div>
            <strong>{t("dashboard.previewTitle")}</strong>
            <span>{t("dashboard.previewDescription")}</span>
          </div>
        </div>
      ) : null}

      <header className="admin-page-heading">
        <div>
          <p className="section-kicker">{t("dashboard.kicker")}</p>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.intro")}</p>
        </div>
        <Link className="button button-primary" href="/admin/izdelki">
          {t("dashboard.openProducts")}
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </header>

      <section aria-label={t("dashboard.summaryAria")} className="admin-stat-grid">
        <article className="admin-stat-card card">
          <span className="admin-stat-icon is-teal"><PackageSearch aria-hidden="true" size={22} /></span>
          <div><strong>{metrics.total}</strong><span>{t("dashboard.productsPreparing")}</span></div>
          <small>{metrics.archived} {t("dashboard.archivedSources")}</small>
        </article>
        <article className="admin-stat-card card">
          <span className="admin-stat-icon is-navy"><PackageCheck aria-hidden="true" size={22} /></span>
          <div><strong>{metrics.active}</strong><span>{t("dashboard.activeProducts")}</span></div>
          <small>{t("dashboard.activationBlocked")}</small>
        </article>
        <article className="admin-stat-card card">
          <span className="admin-stat-icon is-amber"><CircleDollarSign aria-hidden="true" size={22} /></span>
          <div><strong>{metrics.missingSellingPrice}</strong><span>{t("dashboard.withoutSellingPrice")}</span></div>
          <small>{metrics.withSupplierSource} {t("dashboard.traceableSources")}</small>
        </article>
        <article className="admin-stat-card card">
          <span className="admin-stat-icon is-soft"><Sparkles aria-hidden="true" size={22} /></span>
          <div><strong>{metrics.averageReadiness}%</strong><span>{t("dashboard.averageReadiness")}</span></div>
          <small>{t("dashboard.nineChecks")}</small>
        </article>
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-dashboard-panel card">
          <div className="admin-panel-heading">
            <div>
              <p className="section-kicker">{t("dashboard.priorityKicker")}</p>
              <h2>{t("dashboard.priorityTitle")}</h2>
            </div>
            <Link href="/admin/izdelki">{t("dashboard.allProducts")} <ArrowRight aria-hidden="true" size={16} /></Link>
          </div>
          <div className="admin-priority-list">
            {priorityProducts.map((product) => (
              <div key={product.sku}>
                <span className="admin-priority-sku">{product.sku}</span>
                <div>
                  <strong>{product.name}</strong>
                  <span>
                    {product.readiness.missing
                      .slice(0, 2)
                      .map((id) => t(getReadinessTranslationKey(id)))
                      .join(" · ")}
                  </span>
                </div>
                <b>{product.readiness.percentage}%</b>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-dashboard-panel card">
          <div className="admin-panel-heading">
            <div>
              <p className="section-kicker">{t("dashboard.infrastructureKicker")}</p>
              <h2>{t("dashboard.connectionStatus")}</h2>
            </div>
          </div>
          <div className="admin-service-list">
            <div>
              <span className="admin-service-icon"><ShoppingBag aria-hidden="true" size={19} /></span>
              <div><strong>{t("dashboard.localCatalog")}</strong><span>{t("dashboard.localDrafts")}</span></div>
              <span className="admin-service-state is-ready"><CheckCircle2 aria-hidden="true" size={15} /> {t("dashboard.ready")}</span>
            </div>
            {services.map((service) => {
              const presentation = servicePresentation[service.id];
              const Icon = presentation.icon;
              return (
                <div key={service.id}>
                  <span className="admin-service-icon"><Icon aria-hidden="true" size={19} /></span>
                  <div><strong>{t(presentation.nameKey)}</strong><span>{t(presentation.detailKey)}</span></div>
                  <span className={`admin-service-state ${service.connected ? "is-ready" : "is-waiting"}`}>
                    {service.connected ? <CheckCircle2 aria-hidden="true" size={15} /> : <AlertTriangle aria-hidden="true" size={15} />}
                    {service.connected ? t("dashboard.connected") : t("dashboard.notConnected")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
