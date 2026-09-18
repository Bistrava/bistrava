import type { Metadata } from "next";

import { InfoPage } from "@/components/store/info-page";

export const metadata: Metadata = {
  title: "Primerjava izdelkov",
  robots: { index: false, follow: false },
};

export default function ComparisonPage() {
  return (
    <InfoPage
      kicker="Primerjalnik v pripravi"
      title="Primerjajte podatke, ki odločajo"
      path="/primerjava"
      intro="Primerjava bo pokazala pretok, priključke, mere, vzdrževanje, potrošni material in celoten strošek na eni preglednici."
      action={{ label: "Raziščite kategorije", href: "/kategorije" }}
    >
      <h2>Še ni izbranih izdelkov</h2>
      <p>
        Funkcija bo omogočena, ko bodo v katalogu objavljeni preverjeni izdelki.
        Predstavitveni zapis se ne šteje kot prodajni izdelek.
      </p>
    </InfoPage>
  );
}
