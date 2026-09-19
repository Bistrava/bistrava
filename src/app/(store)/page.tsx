import {
  ArrowRight,
  Check,
  Droplets,
  FlaskConical,
  Gauge,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { CatalogProductCard } from "@/components/product/catalog-product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { allCategories, catalogProducts } from "@/lib/catalog/catalog";
import { frequentlyAskedQuestions } from "@/lib/content/faq";
import { featuredGuides } from "@/lib/content/guides";
import { faqSchema } from "@/lib/seo/structured-data";

const homeFaq = frequentlyAskedQuestions.slice(0, 5);
const featuredProducts = catalogProducts.slice(0, 6);
const categoryIcons = [Droplets, ShieldCheck, FlaskConical, PackageCheck] as const;

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqSchema([...homeFaq])} />
      <section className="home-hero home-hero-specialist">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="section-kicker">Specializirana spletna trgovina Bistrava</p>
            <h1>Izdelki za mehko vodo in dom brez vodnega kamna.</h1>
            <p className="hero-lead">
              Na enem mestu primerjajte mehčalce vode, zaščito naprav, teste trdote
              ter izdelke za vzdrževanje. Pri izbiri vam pomagajo jasni tehnični podatki in vodniki.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/mehcalci-vode#katalog">
                Nakupujte izdelke <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link className="button button-secondary" href="/vodici">Preberite vodnike</Link>
            </div>
            <ul className="hero-trust" aria-label="Prednosti trgovine Bistrava">
              <li><Check aria-hidden="true" size={17} /> Specializiran izbor</li>
              <li><Check aria-hidden="true" size={17} /> Preverjeni podatki</li>
              <li><Check aria-hidden="true" size={17} /> Jasna primerjava</li>
            </ul>
          </div>
          <div className="hero-diagnostic card">
            <div className="diagnostic-header"><span className="eyebrow">Pametna izbira</span><span className="diagnostic-code">B / H₂O</span></div>
            <h2>Od potrebe do pravega izdelka</h2>
            <ol>
              <li><span><FlaskConical aria-hidden="true" size={22} /></span><div><strong>Izmerite trdoto</strong><p>Uporabite test ali podatek dobavitelja vode.</p></div></li>
              <li><span><Droplets aria-hidden="true" size={22} /></span><div><strong>Določite namen</strong><p>Celoten dom, posamezna naprava ali redno vzdrževanje.</p></div></li>
              <li><span><Gauge aria-hidden="true" size={22} /></span><div><strong>Primerjajte podatke</strong><p>Preverite pretok, kapaciteto, priključke in dimenzije.</p></div></li>
              <li><span><ShoppingBag aria-hidden="true" size={22} /></span><div><strong>Izberite izdelek</strong><p>Odprite produktno kartico s fotografijami in podrobnostmi.</p></div></li>
            </ol>
          </div>
        </div>
      </section>

      <section className="section need-section">
        <div className="container">
          <p className="section-kicker">Nakupujte po skupinah</p>
          <h2>Vse za obdelavo in vzdrževanje vode</h2>
          <div className="need-grid">
            {allCategories.map((category, index) => {
              const Icon = categoryIcons[index] ?? Droplets;
              return (
                <Link className="need-card card" href={`/mehcalci-vode#${category.slug}`} key={category.slug}>
                  <Icon aria-hidden="true" />
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <span>Oglejte si izdelke <ArrowRight aria-hidden="true" size={17} /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section active-products-home">
        <div className="container">
          <div className="section-heading-row">
            <div><p className="section-kicker">Izpostavljeni izdelki</p><h2>Začnite z najbolj uporabnimi rešitvami</h2></div>
            <Sparkles className="section-mark" aria-hidden="true" />
          </div>
          <div className="catalog-product-grid">
            {featuredProducts.map((product) => <CatalogProductCard key={product.id} product={product} />)}
          </div>
          <div className="hero-actions">
            <Link className="button button-primary" href="/mehcalci-vode#katalog">
              Vseh {catalogProducts.length} izdelkov <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section home-problem-section">
        <div className="container problem-grid">
          <div><p className="section-kicker">Pred nakupom</p><h2>Najprej razumite svojo vodo.</h2></div>
          <div className="problem-copy">
            <p>Trda voda vsebuje več raztopljenega kalcija in magnezija. Pri segrevanju in izhlapevanju se del mineralov izloči v obloge.</p>
            <ul><li>izmerite trdoto vode,</li><li>ocenite porabo in potreben pretok,</li><li>primerjajte tehnične zahteve izdelkov.</li></ul>
            <Link className="button button-secondary" href="/izbira-mehcalca">Odprite vodnik za izbiro</Link>
          </div>
        </div>
      </section>

      <section className="section guides-section">
        <div className="container">
          <div className="section-heading-row"><div><p className="section-kicker">Vodniki in nasveti</p><h2>Izberite samozavestno in vzdržujte pravilno.</h2></div><Link className="button button-secondary" href="/vodici">Vsi vodniki</Link></div>
          <div className="home-guide-grid">{featuredGuides.map((guide) => <Link className="featured-guide card" href={`/vodici/${guide.slug}`} key={guide.slug}><span className="eyebrow">Vodnik Bistrava</span><strong>{guide.title}</strong><span>{guide.excerpt}</span><span className="guide-meta">{guide.readingTime} <ArrowRight aria-hidden="true" size={17} /></span></Link>)}</div>
        </div>
      </section>

      <section className="section home-faq-section">
        <div className="container home-faq-grid">
          <div><p className="section-kicker">Pogosta vprašanja</p><h2>Kratki odgovori pred nakupom.</h2><p className="section-intro">Preverite osnovne pojme, izbiro izdelka in redno vzdrževanje.</p><Link className="button button-secondary" href="/pogosta-vprasanja">Vsa vprašanja</Link></div>
          <div className="product-faq-list">{homeFaq.map((item) => <details className="card" key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </div>
      </section>

      <section className="section home-cta">
        <div className="container cta-panel">
          <ShoppingBag aria-hidden="true" size={42} />
          <div><p className="section-kicker">Trgovina Bistrava</p><h2>Raziščite celoten izbor izdelkov.</h2><p>Primerjajte fotografije, lastnosti in informativne cene v preglednem katalogu.</p></div>
          <Link className="button button-primary" href="/mehcalci-vode#katalog">V trgovino</Link>
        </div>
      </section>
    </>
  );
}
