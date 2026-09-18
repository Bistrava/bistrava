import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import type { SpecialistPageContent } from "@/lib/content/specialist-pages";

export function SpecialistPage({ page }: { page: SpecialistPageContent }) {
  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: page.title, href: page.path }]} />
      </div>
      <header className="specialist-hero">
        <div className="container specialist-hero-grid">
          <div>
            <p className="section-kicker">{page.kicker}</p>
            <h1>{page.title}</h1>
            <p>{page.intro}</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/izbira-mehcalca">
                Izberite pravi profil
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link className="button button-secondary" href="/kontakt">
                Zahtevajte ponudbo
              </Link>
            </div>
          </div>
          <aside className="specialist-summary card">
            <span className="eyebrow">Bistrava pristop</span>
            <h2>{page.leadTitle}</h2>
            <p>{page.lead}</p>
          </aside>
        </div>
      </header>

      <section className="section">
        <div className="container specialist-point-grid">
          {page.points.map((point) => (
            <article className="card" key={point.title}>
              <CheckCircle2 aria-hidden="true" size={26} />
              <h2>{point.title}</h2>
              <p>{point.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section specialist-steps-section">
        <div className="container specialist-steps-grid">
          <div>
            <p className="section-kicker">Od podatka do odločitve</p>
            <h2>{page.stepsTitle}</h2>
            <p className="section-intro">{page.note}</p>
          </div>
          <ol>
            {page.steps.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section related-link-section">
        <div className="container">
          <p className="section-kicker">Nadaljujte brez ugibanja</p>
          <h2>Povezane vsebine in naslednji koraki</h2>
          <div className="related-link-grid">
            {page.related.map((item) => (
              <Link className="card" href={item.href as Route} key={item.href}>
                {item.label} <ArrowRight aria-hidden="true" size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
