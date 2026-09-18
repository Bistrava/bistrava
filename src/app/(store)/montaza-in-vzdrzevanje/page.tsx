import type { Metadata } from "next";

import { InfoPage } from "@/components/store/info-page";

export const metadata: Metadata = {
  title: "Montaža in vzdrževanje",
  description: "Osnovne informacije o pripravi montaže in rednem vzdrževanju.",
  alternates: { canonical: "/montaza-in-vzdrzevanje" },
};

export default function InstallationPage() {
  return (
    <InfoPage
      kicker="Življenjski cikel sistema"
      title="Montaža in vzdrževanje"
      path="/montaza-in-vzdrzevanje"
      intro="Dober sistem mora biti pravilno dimenzioniran, dostopen za servis in podprt z razpoložljivim potrošnim materialom."
      action={{ label: "Pogovor o pogojih montaže", href: "/kontakt" }}
    >
      <h2>Pred montažo</h2>
      <p>
        Preverijo se tlak, največji pretok, vrsta priključkov, električno
        napajanje, odtok in prostor za varno servisiranje.
      </p>
      <h2>Po montaži</h2>
      <p>
        Uporabnik prejme jasen načrt pregledov, menjav in čiščenja. Končni
        intervali bodo vedno temeljili na navodilih proizvajalca in dejanski
        uporabi.
      </p>
    </InfoPage>
  );
}
