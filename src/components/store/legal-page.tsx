import { AlertTriangle, CalendarDays, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import type { LegalPageKey } from "@/lib/content/legal-pages";
import { legalPages } from "@/lib/content/legal-pages";

export function LegalPage({ pageKey }: { pageKey: LegalPageKey }) {
  const page = legalPages[pageKey];

  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: page.title, href: `/${pageKey}` }]} />
      </div>
      <section className="info-hero legal-hero">
        <div className="narrow-container">
          <p className="section-kicker">{page.kicker}</p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          <div className="legal-updated">
            <CalendarDays aria-hidden="true" size={18} />
            Posodobljeno: {page.updatedAt}
          </div>
        </div>
      </section>
      <section className="section legal-page-section">
        <div className="container legal-page-layout">
          <aside className="legal-toc card" aria-label="Vsebina strani">
            <strong>Na tej strani</strong>
            <nav>
              {page.sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>{section.title}</a>
              ))}
            </nav>
            <Link href="/kontakt">Potrebujete pojasnilo?</Link>
          </aside>

          <article className="legal-document card">
            {page.requiresBusinessDetails ? (
              <div className="legal-alert" role="note">
                <AlertTriangle aria-hidden="true" size={22} />
                <div>
                  <strong>Pred začetkom prodaje je potrebna dopolnitev.</strong>
                  <p>Identiteto ponudnika in označena polja mora potrditi upravljavec Bistrava.</p>
                </div>
              </div>
            ) : null}

            {page.sections.map((section) => (
              <section id={section.id} key={section.id}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}><CheckCircle2 aria-hidden="true" size={18} /> <span>{item}</span></li>
                    ))}
                  </ul>
                ) : null}
                {section.callout ? <p className="legal-callout">{section.callout}</p> : null}
              </section>
            ))}

            <footer className="legal-document-footer">
              <p>Vprašanja glede tega dokumenta lahko pošljete prek kontaktnega obrazca.</p>
              <Link className="button button-secondary" href="/kontakt">Kontaktirajte Bistravo</Link>
            </footer>
          </article>
        </div>
      </section>
    </>
  );
}
