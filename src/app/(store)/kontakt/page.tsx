import type { Metadata } from "next";
import { MessagesSquare, PackageSearch, RotateCcw, ShieldCheck } from "lucide-react";

import { InquiryForm } from "@/components/forms/inquiry-form";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "Kontakt in pomoč kupcem",
  description:
    "Kontaktirajte Bistravo glede izbire izdelka, združljivosti, naročila, dostave, vračila ali reklamacije.",
  alternates: { canonical: "/kontakt" },
};

type ContactPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const requestKind = typeof params.vrsta === "string" ? params.vrsta : "kontakt";
  const productSlug = typeof params.izdelek === "string" ? params.izdelek : undefined;
  const type = requestKind === "ponudba" ? "quote" : requestKind === "svetovanje" ? "advice" : "contact";

  return (
    <>
      <div className="container"><Breadcrumbs items={[{ label: "Kontakt", href: "/kontakt" }]} /></div>
      <section className="info-hero contact-hero">
        <div className="container">
          <p className="section-kicker">Pomoč pred nakupom in po njem</p>
          <h1>Kako vam lahko pomagamo?</h1>
          <p>Pošljite vprašanje o izdelku, združljivosti, naročilu, dostavi, vračilu ali reklamaciji. Več konkretnih podatkov nam omogoči natančnejši odgovor.</p>
        </div>
      </section>
      <section className="section contact-support-section">
        <div className="container contact-topic-grid">
          <article className="card"><PackageSearch aria-hidden="true" /><h2>Izbira izdelka</h2><p>Dodajte povezavo ali ime izdelka, namen uporabe in podatke o obstoječem sistemu.</p></article>
          <article className="card"><MessagesSquare aria-hidden="true" /><h2>Naročilo in dostava</h2><p>Navedite številko naročila, ime kupca in kratko vprašanje brez podatkov plačilne kartice.</p></article>
          <article className="card"><RotateCcw aria-hidden="true" /><h2>Vračilo ali reklamacija</h2><p>Opišite stanje izdelka ter priložite fotografije, ko prejmete nadaljnja navodila.</p></article>
        </div>
      </section>
      <section className="section contact-form-section">
        <div className="container contact-grid contact-grid-wide">
          <div className="contact-details card">
            <ShieldCheck aria-hidden="true" />
            <h2>Za hitrejši odgovor</h2>
            <ul>
              <li>pri izdelku navedite model ali povezavo,</li>
              <li>pri naročilu dodajte referenčno številko,</li>
              <li>pri združljivosti opišite priključek in namen,</li>
              <li>ne pošiljajte gesel ali celotnih podatkov kartice.</li>
            </ul>
            <h2>Uradni kontaktni podatki</h2>
            <p>Javni e-poštni naslov, telefon in poslovni naslov bodo objavljeni po potrditvi podatkov ponudnika. Do takrat uporabite varen obrazec.</p>
          </div>
          <InquiryForm
            type={type}
            productSlug={productSlug}
            title={type === "quote" ? "Pošljite vprašanje o ponudbi" : "Pošljite sporočilo"}
            description="Odgovor bomo poslali na navedeni e-poštni naslov."
            defaultMessage={productSlug ? `Zanima me izdelek: ${productSlug}. ` : ""}
          />
        </div>
      </section>
    </>
  );
}
