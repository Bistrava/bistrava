import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { frequentlyAskedQuestions } from "@/lib/content/faq";
import { faqSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Pogosta vprašanja o mehčalcih vode",
  description:
    "Odgovori o trdi vodi, vodnem kamnu, izbiri, montaži, soli in vzdrževanju mehčalnih naprav.",
  alternates: { canonical: "/pogosta-vprasanja" },
};

export default function FrequentlyAskedQuestionsPage() {
  return (
    <>
      <JsonLd data={faqSchema([...frequentlyAskedQuestions])} />
      <div className="container"><Breadcrumbs items={[{ label: "Pogosta vprašanja", href: "/pogosta-vprasanja" }]} /></div>
      <section className="info-hero">
        <div className="container">
          <p className="section-kicker">Jasni odgovori brez pretiravanja</p>
          <h1>Pogosta vprašanja o mehki vodi</h1>
          <p>Odgovori pojasnjujejo načela. Končna izbira naprave vedno temelji na podatkih konkretnega doma in preverjenem tehničnem listu.</p>
        </div>
      </section>
      <section className="section">
        <div className="narrow-container faq-page-list">
          {frequentlyAskedQuestions.map((item) => (
            <details className="card" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
          <div className="faq-contact card">
            <h2>Niste našli svojega vprašanja?</h2>
            <p>Pošljite trdoto, porabo in fotografije mesta montaže.</p>
            <Link className="button button-primary" href="/kontakt">Vprašajte Bistravo</Link>
          </div>
        </div>
      </section>
    </>
  );
}
