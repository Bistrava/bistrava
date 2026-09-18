"use client";

import { ArrowUpRight, ImageIcon, Pencil, Search, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  getCategoryTranslationKey,
  getReadinessTranslationKey,
  useAdminLanguage,
} from "@/components/admin/admin-i18n";
import type { AdminProductSummary } from "@/lib/admin/catalog-dashboard";
import { formatMoney } from "@/lib/commerce/money";

const statusKeys = {
  active: "status.active",
  draft: "status.draft",
  archived: "status.archived",
} as const;

export function AdminProductCatalog({
  products,
  categories,
}: {
  products: AdminProductSummary[];
  categories: Array<{ slug: string; name: string }>;
}) {
  const { t } = useAdminLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [readiness, setReadiness] = useState("all");
  const normalizedQuery = query.trim().toLocaleLowerCase("sl");
  const filteredProducts = products.filter((product) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${product.name} ${product.brand} ${product.sku}`
        .toLocaleLowerCase("sl")
        .includes(normalizedQuery);
    const matchesCategory =
      category === "all" || product.categorySlug === category;
    const matchesReadiness =
      readiness === "all" ||
      (readiness === "blocked" && product.readiness.percentage < 60) ||
      (readiness === "progress" && product.readiness.percentage >= 60);

    return matchesQuery && matchesCategory && matchesReadiness;
  });

  return (
    <>
      <div className="admin-catalog-filters card">
        <label className="admin-search-field">
          <span>{t("catalog.search")}</span>
          <span className="admin-search-input">
            <Search aria-hidden="true" size={19} />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("catalog.searchPlaceholder")}
              type="search"
              value={query}
            />
          </span>
        </label>
        <label>
          <span>{t("catalog.category")}</span>
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="all">{t("catalog.allCategories")}</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {getCategoryTranslationKey(item.slug)
                  ? t(getCategoryTranslationKey(item.slug))
                  : item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("catalog.readiness")}</span>
          <select
            onChange={(event) => setReadiness(event.target.value)}
            value={readiness}
          >
            <option value="all">{t("catalog.allProducts")}</option>
            <option value="blocked">{t("catalog.needsWork")}</option>
            <option value="progress">{t("catalog.wellCompleted")}</option>
          </select>
        </label>
        <div className="admin-filter-result" aria-live="polite">
          <SlidersHorizontal aria-hidden="true" size={18} />
          <strong>{filteredProducts.length}</strong>
          <span>{t("catalog.of")} {products.length} {t("catalog.products")}</span>
        </div>
      </div>

      <div className="admin-product-list" aria-label={t("catalog.listAria")}>
        <div className="admin-product-list-head" aria-hidden="true">
          <span>{t("catalog.product")}</span>
          <span>{t("catalog.commercialData")}</span>
          <span>{t("catalog.readiness")}</span>
          <span>{t("catalog.actions")}</span>
        </div>
        {filteredProducts.map((product) => (
          <article className="admin-product-row card" key={product.sku}>
            <div className="admin-product-identity">
              <div className="admin-product-thumb">
                {product.image ? (
                  <Image
                    alt={product.image.alt}
                    fill
                    sizes="64px"
                    src={product.image.url}
                  />
                ) : (
                  <ImageIcon aria-hidden="true" size={22} />
                )}
              </div>
              <div>
                <span className="admin-product-sku">{product.sku} · {product.brand}</span>
                <h2>{product.name}</h2>
                <span className="admin-product-category">
                  {getCategoryTranslationKey(product.categorySlug)
                    ? t(getCategoryTranslationKey(product.categorySlug))
                    : product.categoryName}
                </span>
              </div>
            </div>
            <div className="admin-product-commerce">
              <span className={`admin-status admin-status-${product.status}`}>
                {t(statusKeys[product.status])}
              </span>
              <dl>
                <div>
                  <dt>{t("catalog.bistravaPrice")}</dt>
                  <dd>{product.priceCents === null ? t("catalog.notDefined") : formatMoney(product.priceCents)}</dd>
                </div>
                <div>
                  <dt>{t("catalog.internalStock")}</dt>
                  <dd>{product.stockQuantity} · {t("catalog.unverified")}</dd>
                </div>
              </dl>
            </div>
            <div className="admin-product-readiness">
              <div>
                <strong>{product.readiness.percentage}%</strong>
                <span>{product.readiness.completed}/{product.readiness.total} {t("catalog.checks")}</span>
              </div>
              <span
                aria-label={`${t("catalog.readiness")} ${product.readiness.percentage}%`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={product.readiness.percentage}
                className="admin-progress"
                role="progressbar"
              >
                <span style={{ width: `${product.readiness.percentage}%` }} />
              </span>
              <p
                title={product.readiness.missing
                  .map((id) => t(getReadinessTranslationKey(id)))
                  .join(", ")}
              >
                {t("catalog.missing")}: {product.readiness.missing
                  .slice(0, 2)
                  .map((id) => t(getReadinessTranslationKey(id)))
                  .join(", ")}
                {product.readiness.missing.length > 2 ? " …" : ""}
              </p>
            </div>
            <div className="admin-product-actions">
              <Link className="button button-primary" href={`/admin/izdelki/${product.slug}`}>
                {t("catalog.edit")}
                <Pencil aria-hidden="true" size={16} />
              </Link>
              {product.status !== "archived" ? (
                <Link className="button button-secondary" href={`/izdelki/${product.slug}`} target="_blank">
                  {t("catalog.preview")}
                  <ArrowUpRight aria-hidden="true" size={16} />
                </Link>
              ) : null}
            </div>
          </article>
        ))}
        {filteredProducts.length === 0 ? (
          <div className="admin-empty-state card">
            <Search aria-hidden="true" size={28} />
            <h2>{t("catalog.noResults")}</h2>
            <p>{t("catalog.noResultsDescription")}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
