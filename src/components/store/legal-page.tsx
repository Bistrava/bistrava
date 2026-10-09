import { AlertTriangle, CalendarDays, CheckCircle2, ExternalLink } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import type { LegalPageContent, LegalPageKey } from "@/lib/content/legal-pages";
import { legalPages } from "@/lib/content/legal-pages";

function ContentLink({ href, label }: { href: string; label: string }) {
  return href.startsWith("/") ? (
    <Link href={href as Route}>{label}</Link>
  ) : href.startsWith("#") ? (
    <a href={href}>{label}</a>
  ) : (
    <a href={href}>{label}<ExternalLink aria-hidden="true" size={15} /></a>
  );
}

export function LegalPage({ pageKey, content }: { pageKey: LegalPageKey; content?: LegalPageContent }) {
  const page = content ?? legalPages[pageKey];
  const isDelivery = pageKey === "dostava";
  const contents = (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: page.title, href: `/${pageKey}` }]} />
      </div>
      <section className="info-hero legal-hero">
        <div className="narrow-container">
          <p className="section-kicker">{page.kicker}</p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          {page.highlights?.length ? (
            <dl className="delivery-highlights">
              {page.highlights.map((highlight) => (
                <div className="delivery-highlight" key={highlight.label}>
                  <dt>{highlight.label}</dt>
                  <dd>
                    <strong>{highlight.href ? <ContentLink href={highlight.href} label={highlight.value} /> : highlight.value}</strong>
                    {highlight.detail ? <span className="delivery-highlight-detail">{highlight.detail}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
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
                {section.table ? (
                  <>
                    <div className={`guide-table-scroll${isDelivery ? " delivery-rate-table" : ""}`} role="region" aria-label={section.table.caption} tabIndex={0}>
                      <table>
                        <caption>{section.table.caption}</caption>
                        <thead><tr>{section.table.headings.map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead>
                        <tbody>{section.table.rows.map((row, index) => <tr key={`${row[0]}:${index}`}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row">{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                    {isDelivery ? (
                      <div className="delivery-rate-cards" role="group" aria-label={section.table.caption}>
                        <p className="delivery-rate-caption">{section.table.caption}</p>
                        {section.table.rows.map((row, index) => (
                          <dl className="delivery-rate-card" key={`${row[0]}:${index}`}>
                            {row.map((cell, cellIndex) => (
                              <div className="delivery-rate-field" key={section.table!.headings[cellIndex]}>
                                <dt>{section.table!.headings[cellIndex]}</dt>
                                <dd>{cell}</dd>
                              </div>
                            ))}
                          </dl>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}><CheckCircle2 aria-hidden="true" size={18} /> <span>{item}</span></li>
                    ))}
                  </ul>
                ) : null}
                {section.callout ? <p className="legal-callout">{section.callout}</p> : null}
                {section.links?.length ? (
                  <div className="legal-section-links">
                    {section.links.map((link) => <ContentLink key={link.href} href={link.href} label={link.label} />)}
                  </div>
                ) : null}
              </section>
            ))}

            <footer className="legal-document-footer">
              <p>{isDelivery ? "Potrebujete pomoč pri dostavi? Pišite nam in navedite številko naročila, če jo že imate." : "Vprašanja glede tega dokumenta lahko pošljete prek kontaktnega obrazca."}</p>
              <Link className="button button-secondary" href="/kontakt">Kontaktirajte Bistravo</Link>
            </footer>
          </article>
        </div>
      </section>
    </>
  );

  return isDelivery ? <div className="delivery-page">{contents}</div> : contents;
}
