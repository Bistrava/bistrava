import type { Metadata } from "next";

import { CatalogProductCard } from "@/components/product/catalog-product-card";
import { allCategories } from "@/lib/catalog/catalog";
import { getStorefrontCatalogProducts } from "@/lib/catalog/repository";

export const metadata: Metadata = {
  title: "Mehčalci vode za hišo in stanovanje",
  description:
    "Oglejte si specializiran izbor mehčalcev vode, zaščite naprav, merilnih pripomočkov ter izdelkov za vzdrževanje.",
  alternates: { canonical: "/mehcalci-vode" },
};

export default async function WaterSoftenersPage() {
  const catalogProducts = await getStorefrontCatalogProducts();
  return (
    <section className="section category-products" id="katalog">
      <div className="container">
        <div className="category-results-heading">
          <div>
            <p className="section-kicker">Trgovina</p>
            <h1>{catalogProducts.length} izdelkov v štirih skupinah</h1>
          </div>
          <p>
            Primerjajte izdelke, preverite cene z DDV in izberite rešitev za svoj dom.
            Trenutna zaloga je prikazana pri vsakem izdelku.
          </p>
        </div>
        {allCategories.map((category) => {
          const products = catalogProducts.filter((product) => product.categorySlug === category.slug);
          if (products.length === 0) return null;
          return (
            <section className="draft-product-group" id={category.slug} key={category.slug}>
              <div className="draft-product-group-heading">
                <div><p className="section-kicker">{category.problem}</p><h2>{category.name}</h2></div>
                <p>{category.description}</p>
              </div>
              <div className="catalog-product-grid">
                {products.map((product) => <CatalogProductCard key={product.id} product={product} />)}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
