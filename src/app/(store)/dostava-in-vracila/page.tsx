import type { Metadata } from "next";

import { InfoPage } from "@/components/store/info-page";

export const metadata: Metadata = {
  title: "Dostava in vračila",
  description: "Informacije o dostavi, vračilih in prevzemu bodo objavljene pred odprtjem trgovine.",
  alternates: { canonical: "/dostava-in-vracila" },
};

export default function ShippingReturnsPage() {
  return (
    <InfoPage
      kicker="Informacije pred odprtjem"
      title="Dostava in vračila"
      path="/dostava-in-vracila"
      intro="Končni pogoji bodo objavljeni pred začetkom prodaje in pravno preverjeni."
    >
      <h2>V pripravi za slovenski trg</h2>
      <p>
        Določili bomo območja dostave, prevoznike, roke, stroške, ravnanje z
        večjimi napravami ter postopek za vračila in reklamacije.
      </p>
      <p className="notice">
        To besedilo ni končni pravni dokument in ne predstavlja prodajnih
        pogojev.
      </p>
    </InfoPage>
  );
}
