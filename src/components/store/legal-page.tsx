import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import type { LegalPageKey } from "@/lib/content/legal-pages";
import { legalPages } from "@/lib/content/legal-pages";

export function LegalPage({ pageKey }: { pageKey: LegalPageKey }) {
  const page = legalPages[pageKey];
  return (
    <>
      <div className="container"><Breadcrumbs items={[{ label: page.title, href: `/${pageKey}` }]} /></div>
      <section className="info-hero"><div className="narrow-container"><p className="section-kicker">Pravni osnutek - pregled je obvezen</p><h1>{page.title}</h1><p>{page.intro}</p></div></section>
      <section className="section info-content"><div className="narrow-container prose-card card"><p className="notice notice-danger">To besedilo je razvojni osnutek. Pred javnim poslovanjem ga mora potrditi pravni strokovnjak z dejanskimi podatki upravljavca in procesov.</p>{page.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}</div></section>
    </>
  );
}
