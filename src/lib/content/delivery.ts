import type { ShippingRate } from "@/lib/commerce/shipping";
import { getEligibleShippingRates } from "@/lib/commerce/shipping-rates";
import { formatMoney } from "@/lib/commerce/money";
import type { LegalPageContent } from "@/lib/content/legal-pages";

export const confirmedDeliveryTiming = {
  preparationDaysMin: 1,
  preparationDaysMax: 2,
  shippingDaysMin: 1,
  shippingDaysMax: 3,
} as const;

export const orderPreparationText = `Naročilo pripravimo v ${confirmedDeliveryTiming.preparationDaysMin}–${confirmedDeliveryTiming.preparationDaysMax} delovnih dneh po potrjenem prejemu celotnega bančnega nakazila.`;
export const standardShippingText = `Po pripravi naročilo oddamo prevozniku. Standardni okvirni čas prevoza je dodatnih ${confirmedDeliveryTiming.shippingDaysMin}–${confirmedDeliveryTiming.shippingDaysMax} delovnih dni po odpremi, kadar pri izbranem načinu dostave ni naveden drugačen rok. Čas prevoza ne vključuje časa bančne obdelave ali priprave naročila.`;

function rateTransitDays(rate: ShippingRate | null) {
  const hasEstimate = rate !== null && rate.estimatedDaysMin !== null && rate.estimatedDaysMax !== null;
  return hasEstimate
    ? { min: rate.estimatedDaysMin!, max: rate.estimatedDaysMax! }
    : { min: confirmedDeliveryTiming.shippingDaysMin, max: confirmedDeliveryTiming.shippingDaysMax };
}

function dayRange(min: number, max: number) {
  return min === max ? String(min) : `${min}–${max}`;
}

export type ProductDeliveryEstimate = {
  /** Cheapest active Slovenian rate for one unit of this product, or null when none applies. */
  rate: ShippingRate | null;
  freeShippingFromCents: number | null;
  handlingDaysMin: number;
  handlingDaysMax: number;
  transitDaysMin: number;
  transitDaysMax: number;
};

// One unit is the basket a shopping ad or product page describes; the cart applies the same thresholds.
export function productDeliveryEstimate(rates: ShippingRate[], priceCents: number | null): ProductDeliveryEstimate {
  const rate = priceCents === null ? null : getEligibleShippingRates(rates, priceCents)[0] ?? null;
  const freeThresholds = rates.filter((candidate) => candidate.priceCents === 0).map((candidate) => candidate.minOrderCents ?? 0);
  const transit = rateTransitDays(rate);
  return {
    rate,
    freeShippingFromCents: freeThresholds.length > 0 ? Math.min(...freeThresholds) : null,
    handlingDaysMin: confirmedDeliveryTiming.preparationDaysMin,
    handlingDaysMax: confirmedDeliveryTiming.preparationDaysMax,
    transitDaysMin: transit.min,
    transitDaysMax: transit.max,
  };
}

export function productDeliveryFacts(estimate: ProductDeliveryEstimate) {
  const { rate, freeShippingFromCents } = estimate;
  const cost = rate === null
    ? "Strošek prikažemo v košarici"
    : rate.priceCents === 0 ? "Brezplačna dostava po Sloveniji" : `${formatMoney(rate.priceCents)} z DDV po Sloveniji`;
  const freeShipping = rate?.priceCents !== 0 && freeShippingFromCents !== null && freeShippingFromCents > 0
    ? `Brezplačna dostava za naročila ${freeShippingFromCents % 100 === 1 ? `nad ${formatMoney(freeShippingFromCents - 1)}` : `od ${formatMoney(freeShippingFromCents)}`}`
    : null;
  return {
    cost,
    freeShipping,
    timing: `Priprava v ${dayRange(estimate.handlingDaysMin, estimate.handlingDaysMax)} delovnih dneh po prejemu plačila, nato prevoz traja ${dayRange(estimate.transitDaysMin, estimate.transitDaysMax)} delovne dni`,
  };
}

function orderRange(rate: ShippingRate) {
  const minimum = rate.minOrderCents ?? 0;
  const maximum = rate.maxOrderCents;
  if (minimum === 0 && maximum === null) return "Vsa naročila";
  if (minimum === 0 && maximum !== null) return `Do ${formatMoney(maximum)} (vključno)`;
  if (maximum === null && minimum % 100 === 1) return `Nad ${formatMoney(minimum - 1)} (od ${formatMoney(minimum)})`;
  if (maximum === null) return `Od ${formatMoney(minimum)} naprej`;
  return `Od ${formatMoney(minimum)} do ${formatMoney(maximum)} (vključno)`;
}

export function createDeliveryPageContent(rates: ShippingRate[]): LegalPageContent {
  const orderedRates = [...rates].sort((a, b) => (a.minOrderCents ?? 0) - (b.minOrderCents ?? 0) || a.priceCents - b.priceCents);
  const paidRate = orderedRates.find((rate) => rate.priceCents > 0);
  const freeRate = orderedRates.find((rate) => rate.priceCents === 0);
  const deliveryEstimates = orderedRates.map((rate) => {
    const transit = rateTransitDays(rate);
    return `${rate.name}: predvidoma ${dayRange(transit.min, transit.max)} delovnih dni po odpremi (brez časa priprave naročila).`;
  });

  return {
    title: "Dostava po Sloveniji",
    kicker: "Jasni stroški, preprost nakup",
    intro: "Vse o stroških, rokih in prevzemu naročila na enem mestu. Preverite tudi, kako slediti pošiljki in kam se obrniti, če potrebujete pomoč.",
    updatedAt: "17. oktober 2026",
    highlights: [
      { label: "Območje dostave", value: "Slovenija", detail: "Dostava na naslove po vsej Sloveniji.", href: "#obmocje" },
      { label: "Predvideni prevoznik", value: "Pošta Slovenije", detail: "Načrtovani prevoznik za slovenski trg.", href: "#prevoznik" },
      paidRate
        ? { label: paidRate.name, value: formatMoney(paidRate.priceCents), detail: `${orderRange(paidRate)}. DDV je vključen.`, href: "#strosek" }
        : { label: "Stroški dostave", value: "Aktualni cenik", detail: "Razpoložljive možnosti preverite spodaj.", href: "#strosek" },
      freeRate
        ? { label: freeRate.name, value: "Brezplačno", detail: orderRange(freeRate), href: "#strosek" }
        : { label: "Pomoč pri dostavi", value: "Pišite nam", detail: "Za vprašanja o vašem naročilu.", href: "/kontakt" },
    ],
    sections: [
      {
        id: "strosek",
        title: "Cenik dostave po Sloveniji",
        paragraphs: orderedRates.length > 0 ? ["Vsi navedeni stroški dostave so v evrih in vključujejo DDV. Velja cenik za vrednost izdelkov v vaši košarici."]
          : ["Cenik dostave trenutno ni na voljo. Pred oddajo naročila morata biti prikazana razpoložljiva dostava in njen končni strošek."],
        table: orderedRates.length > 0 ? {
          caption: "Aktualni stroški dostave za Slovenijo (SI)",
          headings: ["Vrednost izdelkov z DDV", "Dostava", "Strošek z DDV"],
          rows: orderedRates.map((rate) => [orderRange(rate), rate.name, rate.priceCents === 0 ? "Brezplačno" : formatMoney(rate.priceCents)]),
        } : undefined,
        callout: "Prag dostave se izračuna iz vsote prodajnih cen izdelkov z DDV, pred uporabo promocijske kode. Strošek dostave se v ta znesek ne všteva.",
      },
      {
        id: "obracun",
        title: "Kako se izračuna končni znesek",
        paragraphs: [
          "Upoštevamo prodajno ceno in količino vsakega izdelka v košarici. Znižane prodajne cene izdelkov so že vključene; dodatna promocijska koda ne spremeni doseženega praga za dostavo.",
          "Na blagajni pred oddajo naročila vidite izdelke, popust, dostavo in končni znesek. Strošek potrjene dostave se po oddaji naročila ne poveča zaradi teže, velikosti izdelka ali naslova v Sloveniji.",
        ],
      },
      {
        id: "obmocje",
        title: "Območje dostave",
        paragraphs: [
          "Dostavljamo na naslove po vsej Sloveniji (SI). Dostave v druge države trenutno ne ponujamo.",
          "Ob naročilu vnesite ime prejemnika, ulico in hišno številko, poštno številko, kraj ter kontaktno telefonsko številko. Pri poslovnem naslovu dodajte tudi naziv podjetja. Preverite, da je prejemnik prepoznaven na zvoncu ali vhodu.",
        ],
      },
      {
        id: "prevoznik",
        title: "Prevoznik: Pošta Slovenije",
        paragraphs: [
          "Za dostavo po Sloveniji načrtujemo uporabo storitev Pošte Slovenije. Izbira ustrezne storitve je odvisna od velikosti in teže pošiljke; prevoznik za vaše naročilo bo potrjen pred odpremo.",
        ],
        callout: "Pošta Slovenije je predvideni prevoznik. Dostava za Bistravo je organizirana in pripravljena za izvajanje v navedenih rokih.",
      },
      {
        id: "rok",
        title: "Priprava naročila in dobavni rok",
        paragraphs: [
          orderPreparationText,
          standardShippingText,
          "Rok prejema je odvisen tudi od razpoložljivosti izdelka. Sobote, nedelje in prazniki se ne štejejo kot delovni dnevi; določena ura prihoda ni zagotovljena.",
          "Pri izdelkih z različnimi dobavnimi roki vam pred potrditvijo naročila pojasnimo predvideni rok prejema. O morebitni spremembi dobavljivosti vas obvestimo in z vami uskladimo nadaljnje ravnanje.",
        ],
        items: deliveryEstimates.length > 0 ? deliveryEstimates : undefined,
        links: [{ label: "Roki prenosa pri Pošti Slovenije", href: "https://www.posta.si/roki-prenosa" }],
      },
      {
        id: "sledenje",
        title: "Sledenje pošiljki",
        paragraphs: [
          "Po oddaji prevozniku status pošiljke preverite s sledilno številko. Za pošiljke Pošte Slovenije uporabite njihovo uradno stran za sledenje. Če številke nimate ali status dalj časa ostaja nespremenjen, nam pošljite številko naročila prek kontaktnega obrazca.",
          "Obvestila in možnosti spremembe dostave so odvisni od izbrane storitve prevoznika. Podatki v sledenju se lahko prikažejo šele po prvem evidentiranju pošiljke.",
        ],
        links: [
          { label: "Sledi pošiljki pri Pošti Slovenije", href: "https://moja.posta.si/tracking" },
          { label: "Pomoč pri sledenju", href: "/kontakt" },
        ],
      },
      {
        id: "odsotnost",
        title: "Odsotnost in sprememba naslova",
        paragraphs: [
          "Če vas ob dostavi ni doma, upoštevajte navodila prevoznika v prejetem obvestilu. V njem sta navedena kraj in rok prevzema. Po izteku roka se lahko neprevzeta pošiljka vrne pošiljatelju; v takem primeru se obrnite na nas.",
          "Kadar Pošta Slovenije za vašo pošiljko omogoča preusmeritev, so možnosti na voljo v njenem obvestilu ali storitvi MojaPošta. Odvisne so od vrste in faze dostave ter velikosti pošiljke. Prevzem v paketomatu ali na drugi lokaciji zato ni na voljo za vsako naročilo.",
          "Napako v naslovu nam sporočite čim prej s številko naročila. Pred odpremo preverimo možnost popravka; po oddaji prevozniku je sprememba odvisna od njegovih razpoložljivih možnosti.",
        ],
        links: [
          { label: "Moja dostava – moja izbira", href: "https://www.posta.si/zasebno/postne-storitve/prejemanje/moja-dostava-moja-izbira" },
          { label: "Sporoči popravek naslova", href: "/kontakt" },
        ],
      },
      {
        id: "vecji-izdelki",
        title: "Večji in težji izdelki",
        paragraphs: [
          "Mehčalci vode, večje naprave in težji paketi soli lahko zahtevajo drugačen način prevoza ali dogovor o prevzemu. Če je to potrebno, pred odpremo uskladimo dostop do naslova in način izročitve.",
          "Zagotovite dostopno in varno mesto za prevzem. Standardna dostava ne vključuje vnosa v stanovanje, prenosa po stopnicah, montaže ali priklopa naprave, razen če je to izrecno dogovorjeno.",
        ],
        callout: "Velja strošek dostave, prikazan ob naročilu. Zaradi teže ali velikosti izdelka po oddaji naročila ne dodamo nepričakovanega doplačila.",
      },
      {
        id: "prevzem",
        title: "Prevzem in pregled pošiljke",
        paragraphs: [
          "Ob prevzemu preverite število paketov in vidne poškodbe. Če opazite poškodovano embalažo, jo fotografirajte in poškodbo po možnosti zabeležite pri dostavljavcu. Manjkajočo vsebino, napačen izdelek ali skrito poškodbo čim prej sporočite Bistravi prek kontaktnega obrazca s številko naročila.",
          "Zapis pri prevozniku olajša obravnavo, vendar ne izključuje zakonskih pravic potrošnika. Pred vračilom poškodovanega izdelka se obrnite na nas za navodila za varen prevoz.",
        ],
      },
      {
        id: "tezave",
        title: "Zamuda, izguba ali poškodba",
        paragraphs: [
          "Če dogovorjeni rok prejema poteče, pošiljke ne najdete ali je vsebina poškodovana oziroma napačna, se obrnite na Bistravo. Navedite številko naročila, kratek opis težave in sledilno številko, če jo imate. Pri poškodbi so koristne fotografije izdelka in embalaže.",
          "Bistrava je vaša kontaktna točka za rešitev težave in preverjanje pri prevozniku. Kadar dostavo organiziramo mi, nosimo tveganje izgube ali poškodbe do fizičnega prevzema blaga s strani vas ali osebe, ki ste jo pooblastili za prevzem.",
        ],
        links: [{ label: "Prijavi težavo z dostavo", href: "/kontakt" }],
      },
      {
        id: "vracila",
        title: "Vračila in odstop od nakupa",
        paragraphs: [
          "Pogoje odstopa, vračila izdelkov in povračila kupnine najdete na ločeni strani Vračila in povračila. Pred pošiljanjem izdelka nazaj preverite navodila in pravilen naslov za vračilo. Strošek prvotne dostave in strošek vračila sta ločeni postavki; strošek vračila nerabljenega in popolnega izdelka krije Bistrava, podrobnosti pa so pojasnjene v pravilih vračil.",
        ],
        links: [{ label: "Vračila in povračila", href: "/vracila" }],
      },
    ],
  };
}
