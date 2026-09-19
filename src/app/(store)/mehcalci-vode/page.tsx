import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { CatalogProductCard } from "@/components/product/catalog-product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import {
  allCategories,
  catalogProducts,
  getProductsByCategory,
} from "@/lib/catalog/catalog";

export const metadata: Metadata = {
  title: "Mehčalci vode za hišo in stanovanje",
  description:
    "Oglejte si specializiran izbor mehčalcev vode, zaščite naprav, merilnih pripomočkov ter izdelkov za vzdrževanje.",
  alternates: { canonical: "/mehcalci-vode" },
};

export default async function WaterSoftenersPage() {
  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: "Mehčalci vode", href: "/mehcalci-vode" }]} />
      </div>
      <section className="category-hero">
        <div className="container category-hero-grid">
          <div>
            <p className="section-kicker">Specializirana spletna trgovina Bistrava</p>
            <h1>Izdelki za mehko vodo in manj vodnega kamna</h1>
            <p>
              Primerjajte mehčalce, zaščito posameznih naprav, teste trdote in
              izdelke za redno vzdrževanje na enem mestu.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="#katalog">
                Oglejte si vse izdelke <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link className="button button-secondary" href="/izbira-mehcalca">
                Vodnik za izbiro
              </Link>
            </div>
          </div>
          <aside className="category-facts card">
            <span className="eyebrow">Pred primerjavo</span>
            <h2>Pripravite štiri podatke</h2>
            <ul>
              <li><Check aria-hidden="true" /> Trdota vode v °dH</li>
              <li><Check aria-hidden="true" /> Število oseb in kopalnic</li>
              <li><Check aria-hidden="true" /> Poraba in pričakovani pretok</li>
              <li><Check aria-hidden="true" /> Prostor, priključek, odtok in napajanje</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="section specialist-catalog-intro">
        <div className="container specialist-point-grid">
          <article className="card">
            <span className="eyebrow">Hiša</span>
            <h2>Centralno mehčanje</h2>
            <p>Dimenzioniranje mora upoštevati sočasno uporabo, večje porabnike in varen servisni dostop.</p>
            <Link href="/mehcalec-vode-za-hiso">Mehčalec za hišo <ArrowRight aria-hidden="true" size={17} /></Link>
          </article>
          <article className="card">
            <span className="eyebrow">Stanovanje</span>
            <h2>Kompaktna izvedba</h2>
            <p>Najprej se preveri dostop do individualnega dovoda ter možnost odtoka, napajanja in obvoda.</p>
            <Link href="/mehcalec-vode-za-stanovanje">Mehčalec za stanovanje <ArrowRight aria-hidden="true" size={17} /></Link>
          </article>
          <article className="card">
            <span className="eyebrow">Tehnologija</span>
            <h2>Kako deluje mehčanje</h2>
            <p>Ionska izmenjava, regeneracija, sol in vzdrževanje so razloženi brez pretiranih obljub.</p>
            <Link href="/mehcalne-naprave">Mehčalne naprave <ArrowRight aria-hidden="true" size={17} /></Link>
          </article>
        </div>
      </section>

      <section className="section category-products" id="katalog">
        <div className="container">
          <div className="category-results-heading">
            <div>
              <p className="section-kicker">Trgovina</p>
              <h2>{catalogProducts.length} izdelkov v štirih skupinah</h2>
            </div>
            <p>
              Vsak izdelek ima fotografije, opis, tehnične podatke in sledljiv vir
              informativne cene. Razpoložljivost je označena na produktni kartici.
            </p>
          </div>
          {allCategories.map((category) => {
            const products = getProductsByCategory(category.slug);
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
    </>
  );
}
