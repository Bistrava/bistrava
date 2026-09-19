import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "O Bistravi",
  description:
    "Bistrava je slovenska specializirana spletna trgovina za mehčanje vode ter zaščito pred vodnim kamnom.",
  alternates: { canonical: "/o-nas" },
};

export default function AboutPage() {
  return (
    <>
      <div className="container"><Breadcrumbs items={[{ label: "O nas", href: "/o-nas" }]} /></div>
      <section className="info-hero"><div className="container"><p className="section-kicker">Jasna voda. Mirna odločitev.</p><h1>Bistrava je specializirana spletna trgovina.</h1><p>Naš cilj je tehnično temo spremeniti v razumljiv nakup: meritev, primerjava, izbira izdelka in pravilno vzdrževanje.</p></div></section>
      <section className="section"><div className="container about-principle-grid">
        <article className="card"><CheckCircle2 aria-hidden="true" /><h2>Jasno</h2><p>Uporabljamo naravno slovenščino, primerljive podatke in vidne omejitve.</p></article>
        <article className="card"><CheckCircle2 aria-hidden="true" /><h2>Strokovno</h2><p>Izbira se začne z meritvijo ter konča s potrjenim tehničnim listom in izvedljivostjo.</p></article>
        <article className="card"><CheckCircle2 aria-hidden="true" /><h2>Odgovorno</h2><p>Ne izmišljamo cen, certifikatov, zaloge, garancij, ocen ali zdravstvenih trditev.</p></article>
      </div></section>
      <section className="section home-cta"><div className="container cta-panel"><div><p className="section-kicker">Vaš dom, vaši podatki</p><h2>Začnite pri trdoti vode.</h2><p>Vodnik za izbiro pripravi profil rešitve in vas usmeri do ustreznih izdelkov.</p></div><Link className="button button-primary" href="/izbira-mehcalca">Odprite vodnik</Link></div></section>
    </>
  );
}
