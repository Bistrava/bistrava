import type { Metadata } from "next";
import {
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Droplets,
  Scale,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "O Bistravi",
  description:
    "Spoznajte Bistravo, specializirano slovensko spletno trgovino za filtracijo, mehčanje in vzdrževanje vode.",
  alternates: { canonical: "/o-nas" },
};

const principles = [
  {
    icon: SearchCheck,
    title: "Izbor z razlogom",
    text: "Izdelke razvrščamo po namenu, združljivosti in tehničnih podatkih, da lahko primerjate bistveno.",
  },
  {
    icon: BookOpenCheck,
    title: "Znanje pred nakupom",
    text: "Vodniki, tabele in konfigurator pojasnijo trdoto, pretok, priključke, porabo in vzdrževanje.",
  },
  {
    icon: ShieldCheck,
    title: "Preverljive obljube",
    text: "Ceno, zalogo, garancijo, certifikat ali oceno objavimo šele, ko imamo preverljiv podatek.",
  },
] as const;

const process = [
  ["01", "Razumemo težavo", "Trdota, usedline, okus, zaščita naprave ali priprava pitne vode zahtevajo različne rešitve."],
  ["02", "Primerjamo podatke", "Pretok, kapaciteta, priključek, dimenzije, poraba in strošek vzdrževanja so prikazani skupaj."],
  ["03", "Povežemo sistem", "Naprava, združljivi vložki, sol, rezervni deli in navodila morajo tvoriti razumljivo celoto."],
  ["04", "Ostanemo dosegljivi", "Vprašanje o naročilu, združljivosti, vračilu ali uporabi lahko pošljete na enem mestu."],
] as const;

export default function AboutPage() {
  return (
    <>
      <div className="container"><Breadcrumbs items={[{ label: "O nas", href: "/o-nas" }]} /></div>
      <section className="info-hero about-hero">
        <div className="container about-hero-grid">
          <div>
            <p className="section-kicker">Specialisti za boljšo vodo</p>
            <h1>Manj ugibanja. Boljša izbira za vsak dom.</h1>
            <p>Bistrava gradi spletno trgovino, v kateri so izdelki za obdelavo vode razumljivi, primerljivi in povezani z vsebinami, ki pomagajo pri resnični odločitvi.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/mehcalci-vode#katalog">Oglejte si trgovino</Link>
              <Link className="button button-secondary" href="/vodici">Preberite vodnike</Link>
            </div>
          </div>
          <div className="about-focus-card card">
            <Droplets aria-hidden="true" size={36} />
            <span className="eyebrow">Naša usmeritev</span>
            <h2>Specializirana ponudba za celoten vodni sistem.</h2>
            <ul>
              <li><CheckCircle2 aria-hidden="true" size={18} /> Filtracija pitne vode</li>
              <li><CheckCircle2 aria-hidden="true" size={18} /> Mehčanje in zaščita pred vodnim kamnom</li>
              <li><CheckCircle2 aria-hidden="true" size={18} /> Filtri za celoten objekt</li>
              <li><CheckCircle2 aria-hidden="true" size={18} /> Vložki, sol in redno vzdrževanje</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container section-heading-centered">
          <p className="section-kicker">Kako gradimo zaupanje</p>
          <h2>Specializacija se pokaže v podrobnostih.</h2>
          <p className="section-intro">Dober nakup se začne z jasnim vprašanjem in konča z izdelkom, ki ga je mogoče pravilno uporabljati in vzdrževati.</p>
        </div>
        <div className="container about-principle-grid">
          {principles.map(({ icon: Icon, title, text }) => (
            <article className="card" key={title}>
              <Icon aria-hidden="true" />
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section about-process-section">
        <div className="container">
          <div className="section-heading-row">
            <div><p className="section-kicker">Bistrava pristop</p><h2>Od potrebe do dolgoročne uporabe</h2></div>
            <Scale className="section-mark" aria-hidden="true" />
          </div>
          <ol className="about-process-grid">
            {process.map(([number, title, text]) => (
              <li className="card" key={number}>
                <span>{number}</span><strong>{title}</strong><p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section about-commitment-section">
        <div className="container about-commitment-grid">
          <div>
            <BadgeCheck aria-hidden="true" size={34} />
            <p className="section-kicker">Cilj Bistrava</p>
            <h2>Postati najbolj uporabna spletna trgovina za obdelavo vode v Sloveniji.</h2>
          </div>
          <div>
            <p>To pomeni širok, vendar urejen izbor, kakovostne produktne kartice, poštene primerjave, zanesljivo dostavo in podporo, ki razume izdelek tudi po nakupu.</p>
            <Link className="button button-primary" href="/kontakt"><ShoppingBag aria-hidden="true" size={18} /> Kontaktirajte nas</Link>
          </div>
        </div>
      </section>
    </>
  );
}
