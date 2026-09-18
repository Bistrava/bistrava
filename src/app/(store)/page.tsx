import {
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  Droplets,
  FlaskConical,
  Gauge,
  House,
  PackageCheck,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { CatalogProductCard } from "@/components/product/catalog-product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getActiveCatalogProducts } from "@/lib/catalog/repository";
import { frequentlyAskedQuestions } from "@/lib/content/faq";
import { featuredGuides } from "@/lib/content/guides";
import { faqSchema } from "@/lib/seo/structured-data";

const homeFaq = frequentlyAskedQuestions.slice(0, 5);

const needs = [
  { icon: House, title: "Hiša", text: "Centralno mehčanje z dimenzioniranjem po trdoti, porabi in pretoku.", href: "/mehcalec-vode-za-hiso" },
  { icon: Building2, title: "Stanovanje", text: "Kompaktna rešitev po preverbi dovoda, prostora, odtoka in pravil stavbe.", href: "/mehcalec-vode-za-stanovanje" },
  { icon: ShieldCheck, title: "Grelnik in naprave", text: "Ciljna zaščita, kadar obravnava celotnega doma ni izbrana pot.", href: "/vodni-kamen" },
  { icon: Gauge, title: "Večja poraba", text: "Profil za več kopalnic ali višji sočasni pretok s tehničnim izračunom.", href: "/izbira-mehcalca" },
  { icon: PackageCheck, title: "Sol in potrošni material", text: "Združljivi materiali in jasen načrt rednega vzdrževanja.", href: "/sol-za-mehcalec-vode" },
  { icon: Wrench, title: "Montaža in servis", text: "Od pregleda priključkov do nastavitve, predaje in vzdrževanja.", href: "/montaza-mehcalca-vode" },
] as const;

const installationSteps = [
  "Analiza potreb",
  "Izbira naprave",
  "Pisna ponudba",
  "Montaža",
  "Nastavitev in preizkus",
  "Načrt vzdrževanja",
];

export default async function HomePage() {
  const activeProducts = await getActiveCatalogProducts();
  return (
    <>
      <JsonLd data={faqSchema([...homeFaq])} />
      <section className="home-hero home-hero-specialist">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="section-kicker">Bistrava - strokovnjak za mehko vodo brez vodnega kamna</p>
            <h1>Mehka voda. Manj vodnega kamna. Več udobja doma.</h1>
            <p className="hero-lead">
              Analiza, svetovanje, mehčalci vode, montaža in vzdrževanje za slovenske
              hiše in stanovanja - na podlagi meritev, ne ugibanja.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/izbira-mehcalca">
                Izberite pravi mehčalec <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link className="button button-secondary" href="/kontakt?vrsta=ponudba">
                Zahtevajte ponudbo
              </Link>
            </div>
            <ul className="hero-trust" aria-label="Načela Bistrava">
              <li><Check aria-hidden="true" size={17} /> Izmerjena trdota</li>
              <li><Check aria-hidden="true" size={17} /> Preverjeni tehnični podatki</li>
              <li><Check aria-hidden="true" size={17} /> Jasne omejitve</li>
            </ul>
          </div>
          <div className="hero-diagnostic card">
            <div className="diagnostic-header"><span className="eyebrow">Prvi pregled doma</span><span className="diagnostic-code">B / H₂O</span></div>
            <h2>Štirje podatki pred izbiro</h2>
            <ol>
              <li><span><FlaskConical aria-hidden="true" size={22} /></span><div><strong>Trdota v °dH</strong><p>Meritev ali dovolj svež podatek dobavitelja vode.</p></div></li>
              <li><span><Droplets aria-hidden="true" size={22} /></span><div><strong>Poraba in pretok</strong><p>Osebe, kopalnice in sočasna uporaba.</p></div></li>
              <li><span><Settings2 aria-hidden="true" size={22} /></span><div><strong>Mesto montaže</strong><p>Dovod, odtok, napajanje, prostor in obvod.</p></div></li>
              <li><span><ClipboardCheck aria-hidden="true" size={22} /></span><div><strong>Preverjen model</strong><p>Šele nato primerjava cene, kapacitete in servisa.</p></div></li>
            </ol>
          </div>
        </div>
      </section>

      <section className="section home-problem-section">
        <div className="container problem-grid">
          <div>
            <p className="section-kicker">Praktična težava, mirna razlaga</p>
            <h2>Vodni kamen je viden tam, kjer se voda segreva ali suši.</h2>
          </div>
          <div className="problem-copy">
            <p>Trda voda vsebuje več raztopljenega kalcija in magnezija. Pri segrevanju in izhlapevanju se del mineralov izloči v obloge.</p>
            <ul><li>več čiščenja armatur, stekla in ploščic,</li><li>obloge na grelnih površinah in napravah,</li><li>več pozornosti pri vzdrževanju grelnikov in napeljave.</li></ul>
            <p className="notice">Trde vode ne opisujemo kot nevarne. Govorimo o meritvah, oblogah, udobju in vzdrževanju.</p>
          </div>
        </div>
      </section>

      <section className="section need-section">
        <div className="container">
          <p className="section-kicker">Rešitev glede na dejansko potrebo</p>
          <h2>Za kateri dom ali porabnik izbirate?</h2>
          <div className="need-grid">
            {needs.map(({ icon: Icon, ...need }) => (
              <Link className="need-card card" href={need.href} key={need.title}>
                <Icon aria-hidden="true" />
                <h3>{need.title}</h3><p>{need.text}</p><span>Preverite možnosti <ArrowRight aria-hidden="true" size={17} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section configurator-feature">
        <div className="container configurator-feature-grid">
          <div>
            <p className="section-kicker">Konfigurator mehčalca</p>
            <h2>Od trdote in porabe do primernega profila rešitve.</h2>
            <p>V treh korakih zberemo lokacijo, trdoto, gospodinjstvo, porabo, kopalnice in pogoje montaže. Kontaktne podatke zahtevamo šele po rezultatu.</p>
            <Link className="button button-primary" href="/izbira-mehcalca">Začnite konfiguracijo <ArrowRight aria-hidden="true" size={18} /></Link>
          </div>
          <div className="configurator-preview card">
            <span className="eyebrow">Deterministična priporočila</span>
            <ol><li><b>01</b><span>Izmerjena trdota</span></li><li><b>02</b><span>Poraba in pretok</span></li><li><b>03</b><span>Prostor in priključki</span></li></ol>
            <p>Če podatkov ni dovolj, konfigurator ne ugiba izdelka, temveč predlaga meritev ali svetovanje.</p>
          </div>
        </div>
      </section>

      <section className="section active-products-home">
        <div className="container">
          <div className="section-heading-row">
            <div><p className="section-kicker">Preverjena ponudba</p><h2>Izdelki so aktivni šele po potrditvi vseh ključnih podatkov.</h2></div>
            <Sparkles className="section-mark" aria-hidden="true" />
          </div>
          {activeProducts.length > 0 ? (
            <div className="catalog-product-grid">{activeProducts.slice(0, 3).map((product) => <CatalogProductCard key={product.id} product={product} />)}</div>
          ) : (
            <div className="catalog-holding card">
              <div><span className="eyebrow">Brez lažne razpoložljivosti</span><h3>Trenutno ni aktivnih spletnih izdelkov.</h3><p>Specializirani osnutki so ločeni od ponudbe, dokler niso potrjeni dobaviteljska cena, zaloga, tehnični list, slika in prodajni pogoji.</p></div>
              <Link className="button button-secondary" href="/mehcalci-vode#katalog">Preglejte katalog v pripravi</Link>
            </div>
          )}
        </div>
      </section>

      <section className="section technology-section">
        <div className="container technology-grid">
          <div><p className="section-kicker">Kako deluje mehčanje</p><h2>Ionska izmenjava, regeneracija, sol in vzdrževanje.</h2><p>Pri ionskem mehčanju smola iz vode odstranjuje predvsem kalcijeve in magnezijeve ione. Po izčrpanju sposobnosti sledi regeneracija s slanico.</p><Link className="button button-secondary" href="/mehcalne-naprave">Razumite tehnologijo</Link></div>
          <div className="technology-flow card" aria-label="Potek ionskega mehčanja"><div><b>01</b><span>Trda voda vstopi v napravo</span></div><ArrowRight aria-hidden="true" /><div><b>02</b><span>Ionska smola zmanjša trdoto</span></div><ArrowRight aria-hidden="true" /><div><b>03</b><span>Smola se regenerira s slanico</span></div></div>
        </div>
      </section>

      <section className="section installation-process">
        <div className="container">
          <p className="section-kicker">Montaža brez presenečenj</p><h2>Jasen postopek od potrebe do vzdrževanja.</h2>
          <ol className="installation-step-grid">{installationSteps.map((item, index) => <li className="card" key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}</ol>
          <Link className="button button-secondary" href="/montaza-mehcalca-vode">Preverite potek montaže</Link>
        </div>
      </section>

      <section className="section guides-section">
        <div className="container">
          <div className="section-heading-row"><div><p className="section-kicker">Vodniki Bistrava</p><h2>Razumite vodo pred nakupom naprave.</h2></div><Link className="button button-secondary" href="/vodici">Vsi vodniki</Link></div>
          <div className="home-guide-grid">{featuredGuides.map((guide) => <Link className="featured-guide card" href={`/vodici/${guide.slug}`} key={guide.slug}><span className="eyebrow">Osnutek vodnika</span><strong>{guide.title}</strong><span>{guide.excerpt}</span><span className="guide-meta">{guide.readingTime} <ArrowRight aria-hidden="true" size={17} /></span></Link>)}</div>
        </div>
      </section>

      <section className="section home-faq-section">
        <div className="container home-faq-grid">
          <div><p className="section-kicker">Pogosta vprašanja</p><h2>Kratki odgovori pred odločitvijo.</h2><p className="section-intro">Vidna vprašanja na strani so enaka podatkom FAQ, ki jih posredujemo iskalnikom.</p><Link className="button button-secondary" href="/pogosta-vprasanja">Vsa vprašanja</Link></div>
          <div className="product-faq-list">{homeFaq.map((item) => <details className="card" key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </div>
      </section>

      <section className="section home-cta">
        <div className="container cta-panel">
          <ShieldCheck aria-hidden="true" size={42} />
          <div><p className="section-kicker">Ponudba na podlagi podatkov</p><h2>Pripravimo smiseln naslednji korak za vaš dom.</h2><p>Pošljite trdoto, porabo in fotografije mesta montaže. Brez obljubljanja cene, zaloge ali termina pred preverbo.</p></div>
          <Link className="button button-primary" href="/kontakt?vrsta=ponudba">Zahtevajte ponudbo</Link>
        </div>
      </section>
    </>
  );
}
