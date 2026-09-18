import type { Metadata } from "next";
import { ClipboardCheck, MapPin, ShieldCheck } from "lucide-react";

import { InquiryForm } from "@/components/forms/inquiry-form";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "Kontakt in ponudba za mehčalec vode",
  description:
    "Pošljite podatke o trdoti vode, gospodinjstvu in mestu montaže za svetovanje ali pripravo ponudbe.",
  alternates: { canonical: "/kontakt" },
};

type ContactPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const requestKind = typeof params.vrsta === "string" ? params.vrsta : "kontakt";
  const productSlug = typeof params.izdelek === "string" ? params.izdelek : undefined;
  const type =
    requestKind === "ponudba"
      ? "quote"
      : requestKind === "montaza"
        ? "installation"
        : requestKind === "servis"
          ? "service"
          : requestKind === "svetovanje"
            ? "advice"
            : "contact";

  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: "Kontakt", href: "/kontakt" }]} />
      </div>
      <section className="info-hero">
        <div className="container">
          <p className="section-kicker">Analiza, svetovanje in ponudba</p>
          <h1>Opišite vodo, gospodinjstvo in prostor.</h1>
          <p>
            Več uporabnih podatkov pomeni natančnejši naslednji korak. Če trdote
            še ne poznate, to preprosto napišite - ne bomo ugibali.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container contact-grid contact-grid-wide">
          <div className="contact-details card">
            <ClipboardCheck aria-hidden="true" />
            <h2>Kaj je koristno priložiti</h2>
            <p>
              Trdoto v °dH, število oseb in kopalnic, mesečno porabo, fotografije
              dovoda, prostor, odtok ter premer priključka, če ga poznate.
            </p>
            <MapPin aria-hidden="true" />
            <h2>Območje</h2>
            <p>Začetni trg in jezik storitve: Slovenija.</p>
            <ShieldCheck aria-hidden="true" />
            <h2>Brez nepreverjenih obljub</h2>
            <p>
              Oddaja obrazca ni potrditev cene, zaloge, termina, garancije ali
              primernosti konkretnega izdelka.
            </p>
          </div>
          <InquiryForm
            type={type}
            productSlug={productSlug}
            title={type === "quote" ? "Zahtevajte preverbo ponudbe" : "Pošljite podatke za pregled"}
            defaultMessage={productSlug ? `Zanima me preverba izdelka: ${productSlug}. ` : ""}
          />
        </div>
      </section>
    </>
  );
}
