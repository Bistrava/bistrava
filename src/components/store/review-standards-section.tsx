import {
  BadgeCheck,
  CalendarCheck2,
  Eye,
  Gift,
  MessageCircleReply,
  PackageCheck,
  PenLine,
  Scale,
  ShieldCheck,
  Tag,
} from "lucide-react";

const reviewStandards = [
  {
    icon: PackageCheck,
    title: "Preverjen nakup",
    text: "Mnenje povežemo z resničnim naročilom, kadar je to mogoče.",
  },
  {
    icon: BadgeCheck,
    title: "Resnična izkušnja",
    text: "Objavimo samo izkušnjo, ki jo lahko smiselno preverimo.",
  },
  {
    icon: Tag,
    title: "Točen izdelek",
    text: "Jasno navedemo izdelek in različico, na katera se mnenje nanaša.",
  },
  {
    icon: CalendarCheck2,
    title: "Datum izkušnje",
    text: "Bralec vidi, kdaj je bil izdelek kupljen ali preizkušen.",
  },
  {
    icon: Scale,
    title: "Tudi kritična mnenja",
    text: "Utemeljene kritike imajo enako mesto kot pohvale.",
  },
  {
    icon: PenLine,
    title: "Brez prepisovanja",
    text: "Besedila ne povzemamo iz drugih trgovin ali katalogov.",
  },
  {
    icon: Gift,
    title: "Označene spodbude",
    text: "Morebitno darilo ali ugodnost ob oddaji mnenja jasno razkrijemo.",
  },
  {
    icon: MessageCircleReply,
    title: "Odgovor Bistrave",
    text: "Na vprašanje ali težavo odgovorimo vsebinsko in javno, kadar je primerno.",
  },
  {
    icon: ShieldCheck,
    title: "Varovana zasebnost",
    text: "Brez dovoljenja ne objavimo polnega imena ali osebnih podatkov.",
  },
  {
    icon: Eye,
    title: "Jasna moderacija",
    text: "Mnenje odstranimo le ob zlorabi, lažni vsebini ali kršitvi pravic.",
  },
] as const;

function ReviewStandardsTrack({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      aria-hidden={duplicate || undefined}
      className="review-standards-track"
      data-review-track={duplicate ? "duplicate" : "primary"}
    >
      {reviewStandards.map(({ icon: Icon, title, text }) => (
        <article className="review-standard-card" key={title}>
          <span className="review-standard-icon"><Icon aria-hidden="true" size={21} /></span>
          <div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
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
          <p className="section-kicker">Mnenja strank</p>
          <h2 id="review-standards-title">Zaupanje se začne z resničnimi izkušnjami.</h2>
        </div>
        <p>
          Bistrava bo objavljala le preverljiva mnenja resničnih kupcev. Do prvih
          zaključenih naročil prikazujemo deset pravil, po katerih bomo zbirali,
          preverjali in predstavljali ocene.
        </p>
      </div>
      <div className="review-standards-marquee" role="region" aria-label="Pravila za objavo mnenj strank" tabIndex={0}>
        <div className="review-standards-motion">
          <ReviewStandardsTrack />
          <ReviewStandardsTrack duplicate />
        </div>
      </div>
      <div className="container review-standards-note">
        <BadgeCheck aria-hidden="true" size={19} />
        <p>Prva preverjena mnenja bodo objavljena skupaj z načinom preverjanja.</p>
      </div>
    </section>
  );
}
