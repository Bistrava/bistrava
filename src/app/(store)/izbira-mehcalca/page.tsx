import type { Metadata } from "next";

import { SoftenerConfigurator } from "@/components/configurator/softener-configurator";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "Izbira mehčalca vode",
  description:
    "Konfigurator za izbiro profila mehčalca glede na trdoto vode, gospodinjstvo, porabo in pogoje montaže.",
  alternates: { canonical: "/izbira-mehcalca" },
};

export default function SoftenerChoicePage() {
  return (
    <>
      <div className="container"><Breadcrumbs items={[{ label: "Izbira mehčalca", href: "/izbira-mehcalca" }]} /></div>
      <section className="info-hero configurator-hero">
        <div className="container">
          <p className="section-kicker">Vodena izbira brez ugibanja</p>
          <h1>Izberite profil mehčalca vode</h1>
          <p>
            Vnesite podatke v treh kratkih korakih. Konfigurator vrne največ tri
            primerne profile in jasno pove, kdaj podatkov ni dovolj.
          </p>
        </div>
      </section>
      <section className="section configurator-section">
        <div className="container"><SoftenerConfigurator /></div>
      </section>
    </>
  );
}
