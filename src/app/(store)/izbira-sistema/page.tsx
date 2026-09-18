import type { Metadata } from "next";

import { InfoPage } from "@/components/store/info-page";

export const metadata: Metadata = {
  title: "Pomoč pri izbiri sistema",
  description: "Prvi koraki do ustreznega sistema za obdelavo vode doma.",
  alternates: { canonical: "/izbira-sistema" },
};

export default function SystemChoicePage() {
  return (
    <InfoPage
      kicker="Usmerjevalnik v pripravi"
      title="Izbira sistema brez ugibanja"
      path="/izbira-sistema"
      intro="Končni usmerjevalnik bo povezal težavo, podatke o vodi in pogoje namestitve. V tej fazi je pripravljen vsebinski okvir."
      action={{ label: "Pošljite nam vprašanje", href: "/kontakt" }}
    >
      <h2>Podatki, ki jih bomo potrebovali</h2>
      <ol>
        <li>Kraj in vir vode: javni vodovod, lastni vir ali drugo.</li>
        <li>Rezultat analize ali konkretni znaki, ki jih opažate.</li>
        <li>Mesto uporabe in največji pričakovani pretok.</li>
        <li>Fotografija prostora, priključkov in morebitnega odtoka.</li>
      </ol>
      <p className="notice">
        Usmerjevalnik ne bo nadomestil laboratorijske analize ali strokovnega
        ogleda, kadar sta potrebna.
      </p>
    </InfoPage>
  );
}
