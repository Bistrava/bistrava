import { Info, Quote, Star } from "lucide-react";

const sampleReviews = [
  {
    profile: "Za družinski dom",
    text: "Ponudba je pregledna in hitro sem razumel, kateri podatki so pomembni pri izbiri naprave za našo hišo.",
  },
  {
    profile: "Izbira filtra za pitno vodo",
    text: "Primerjava izdelkov mi je prihranila veliko časa. Tehnične razlike so razložene jasno in brez zapletenih izrazov.",
  },
  {
    profile: "Prvi nakup mehčalne naprave",
    text: "Končno sem na enem mestu našel razlago trdote vode, pretoka in vzdrževanja ter lažje izbral primerno rešitev.",
  },
  {
    profile: "Zaščita gospodinjskih naprav",
    text: "Všeč mi je, da so priključki, mere in namen uporabe prikazani pregledno. Pri izbiri ni bilo nepotrebnega ugibanja.",
  },
  {
    profile: "Nakup testnega kompleta",
    text: "Navodila so razumljiva, pot do pravega izdelka pa kratka. Točno takšno pomoč sem potreboval pred nakupom.",
  },
  {
    profile: "Redno vzdrževanje sistema",
    text: "Sol, vložke in pripomočke za vzdrževanje lahko poiščem na enem mestu, brez dolgega iskanja po različnih trgovinah.",
  },
  {
    profile: "Prenova družinske hiše",
    text: "Fotografije in tehnični podatki so mi pomagali preveriti prostor ter priključke, še preden sem izdelek dodal v košarico.",
  },
  {
    profile: "Rešitev za stanovanje",
    text: "Cenim miren in strokoven pristop. Stran jasno pokaže, katere rešitve so smiselne za stanovanje in katere za hišo.",
  },
  {
    profile: "Nakup dodatne opreme",
    text: "Kategorije so logične, košarica je preprosta, informacije o dostavi in vračilu pa so hitro dostopne.",
  },
  {
    profile: "Raziskovanje pred nakupom",
    text: "Vodniki odgovorijo na konkretna vprašanja in pomagajo primerjati možnosti. Bistravo bi z veseljem priporočil naprej.",
  },
] as const;

function SampleReviewTrack({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      aria-hidden={duplicate || undefined}
      className="review-standards-track"
      data-review-track={duplicate ? "duplicate" : "primary"}
    >
      {sampleReviews.map(({ profile, text }) => (
        <article className="review-standard-card" key={profile}>
          <header>
            <span className="review-stars" aria-label="5 od 5 zvezdic">
              {Array.from({ length: 5 }, (_, index) => <Star aria-hidden="true" fill="currentColor" key={index} size={17} />)}
            </span>
            <span className="review-standard-icon"><Quote aria-hidden="true" size={21} /></span>
          </header>
          <blockquote>“{text}”</blockquote>
          <footer>
            <strong>{profile}</strong>
            <span>Vzorčno mnenje</span>
          </footer>
        </article>
      ))}
    </div>
  );
}

export function ReviewStandardsSection() {
  return (
    <section className="section review-standards-section" aria-labelledby="review-standards-title">
      <div className="container review-standards-heading">
        <div>
          <p className="section-kicker">Mnenja kupcev</p>
          <h2 id="review-standards-title">Izkušnje, ki jih želimo ustvarjati.</h2>
        </div>
        <p>
          Kratka, jasna in uporabna nakupna izkušnja od prve primerjave do izbire
          pravega izdelka za obdelavo vode.
        </p>
      </div>
      <div className="review-standards-marquee" role="region" aria-label="Predstavitveni primeri mnenj" tabIndex={0}>
        <div className="review-standards-motion">
          <SampleReviewTrack />
          <SampleReviewTrack duplicate />
        </div>
      </div>
      <div className="container review-standards-note">
        <Info aria-hidden="true" size={19} />
        <p>Predstavitveni primeri za prikaz strani; ne gre za izjave dejanskih kupcev.</p>
      </div>
    </section>
  );
}
