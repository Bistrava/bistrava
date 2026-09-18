import type { Metadata } from "next";
import { ArrowRight, Check, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogProductCard } from "@/components/product/catalog-product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import {
  allCategories,
  getCatalogCategory,
  getCategoryDetails,
  getProductsByCategory,
} from "@/lib/catalog/catalog";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCatalogCategory(slug);

  if (!category) return {};

  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/kategorije/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCatalogCategory(slug);

  if (!category) notFound();

  const products = getProductsByCategory(category.slug);
  const details = getCategoryDetails(category.slug);

  return (
    <>
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Rešitve", href: "/kategorije" },
            { label: category.name, href: `/kategorije/${category.slug}` },
          ]}
        />
      </div>
      <section className="category-hero">
        <div className="container category-hero-grid">
          <div>
            <p className="section-kicker">{category.problem}</p>
            <h1>{category.name}</h1>
            <p>{category.description}</p>
            <Link className="button button-primary" href="/izbira-sistema">
              Preverite, ali je ta pristop primeren
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
          <aside className="category-facts card">
            <span className="eyebrow">Pred primerjavo</span>
            <h2>Preverite osnovne pogoje</h2>
            <ul>
              {details.checks.map((check) => (
                <li key={check}>
                  <Check aria-hidden="true" /> {check}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="section category-products">
        <div className="container">
          <div className="category-results-heading">
            <div>
              <p className="section-kicker">Katalog v pripravi</p>
              <h2>
                {products.length > 0
                  ? `${products.length} produktnih kartic`
                  : "Ponudba bo dodana po preverbi"}
              </h2>
            </div>
            <p>
              Kartice imajo potrjene nazive in SEO-osnovo. Cena, zaloga,
              lastnosti in prodajni pogoji še niso objavljeni.
            </p>
          </div>

          {products.length > 0 ? (
            <div className="catalog-product-grid">
              {products.map((product) => (
                <CatalogProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-catalog card">
              <Info aria-hidden="true" size={28} />
              <div>
                <h3>Za to kategorijo še ni potrjenih produktnih kartic.</h3>
                <p>
                  Kategorija ostaja pripravljena za prihodnje preverjene izdelke
                  in strokovno vsebino.
                </p>
              </div>
              <Link className="button button-secondary" href="/kontakt">
                Pošljite vprašanje
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
