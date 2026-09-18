import type { Metadata } from "next";
import { ArrowRight, Check, Info } from "lucide-react";
import Link from "next/link";

import { CatalogProductCard } from "@/components/product/catalog-product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import {
  allCategories,
  getProductsByCategory,
  specialistProducts,
} from "@/lib/catalog/catalog";
import { getActiveCatalogProducts } from "@/lib/catalog/repository";

export const metadata: Metadata = {
  title: "Mehčalci vode za hišo in stanovanje",
  description:
    "Primerjajte pristope za mehčanje vode, preverite pogoje montaže in preglejte strokovno pripravljen katalog Bistrava.",
  alternates: { canonical: "/mehcalci-vode" },
};

export default async function WaterSoftenersPage() {
  const activeProducts = await getActiveCatalogProducts();
  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: "Mehčalci vode", href: "/mehcalci-vode" }]} />
      </div>
      <section className="category-hero">
        <div className="container category-hero-grid">
          <div>
            <p className="section-kicker">Bistrava - strokovnjak za mehko vodo</p>
            <h1>Mehčalci vode za manj vodnega kamna doma</h1>
            <p>
              Prava naprava je rezultat meritve trdote, ocene porabe in pretoka ter
              preverjenih pogojev montaže. Modela ne izbiramo samo po številu oseb.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/izbira-mehcalca">
                Izberite pravi mehčalec <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link className="button button-secondary" href="/kontakt?vrsta=ponudba">
                Zahtevajte ponudbo
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

      <section className="section active-catalog-section">
        <div className="container">
          <p className="section-kicker">Aktivna ponudba</p>
          <h2>Objavljeni so samo popolnoma preverjeni izdelki</h2>
          {activeProducts.length === 0 ? (
            <div className="empty-catalog card">
              <Info aria-hidden="true" size={28} />
              <div>
                <h3>Spletna prodaja še nima aktivnih izdelkov.</h3>
                <p>
                  Nobenega osnutka ne prikazujemo kot dobavljiv izdelek. Do potrditve
                  dobaviteljskih cenikov in tehničnih listov lahko zahtevate individualno ponudbo.
                </p>
              </div>
              <Link className="button button-secondary" href="/kontakt?vrsta=ponudba">Zahtevajte ponudbo</Link>
            </div>
          ) : (
            <div className="catalog-product-grid">
              {activeProducts.map((product) => <CatalogProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section category-products" id="katalog">
        <div className="container">
          <div className="category-results-heading">
            <div>
              <p className="section-kicker">Ločen katalog v pripravi</p>
              <h2>{specialistProducts.length} specializiranih osnutkov</h2>
            </div>
            <p>
              Vsaka kartica ima kratki in dolgi opis ter popoln tehnični okvir.
              Neznane cene, zaloga in specifikacije so jasno označene kot nepotrjene.
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
