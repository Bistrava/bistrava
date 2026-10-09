import type { ShippingRate } from "@/lib/commerce/shipping";
import { formatMoney } from "@/lib/commerce/money";
import type { LegalPageContent } from "@/lib/content/legal-pages";

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
  const deliveryEstimates = orderedRates.flatMap((rate) => {
    if (rate.estimatedDaysMin === null || rate.estimatedDaysMax === null) return [];
    const days = rate.estimatedDaysMin === rate.estimatedDaysMax ? String(rate.estimatedDaysMin) : `${rate.estimatedDaysMin}–${rate.estimatedDaysMax}`;
    return [`${rate.name}: ${days} delovnih dni.`];
  });

  return {
    title: "Dostava",
    kicker: "Jasni stroški, preprost nakup",
    intro: "Stroški dostave po Sloveniji, način izračuna in informacije za prevzem vašega naročila.",
    updatedAt: "9. oktober 2026",
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
        paragraphs: ["Dostava je na voljo na naslove v Sloveniji (SI). Dostave v druge države trenutno ne ponujamo. Za pravilno dostavo vnesite popoln naslov, poštno številko in kraj."],
      },
      {
        id: "rok",
        title: "Dobavni rok",
        paragraphs: [
          "Dobavni rok preverite na strani izbranega izdelka. Za izdelke z različnimi roki se upoštevajo podatki, prikazani pri posameznem izdelku oziroma pred potrditvijo naročila.",
          "Če je pri načinu dostave naveden dodatni predvideni rok, je prikazan spodaj in na blagajni. Delovni dnevi ne vključujejo sobot, nedelj in praznikov. Ob spremembi dobavljivosti vas obvestimo pred potrditvijo novega roka.",
        ],
        items: deliveryEstimates.length > 0 ? deliveryEstimates : undefined,
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
        id: "tveganje",
        title: "Tveganje med prevozom",
        paragraphs: ["Kadar prevoznika organizira Bistrava, tveganje poškodbe ali izgube praviloma preide na potrošnika, ko blago fizično prejme on ali pooblaščena tretja oseba. Za prevoznika, ki ga potrošnik naroči sam in ga Bistrava ni ponudila, veljajo zakonska pravila za tak primer."],
      },
    ],
  };
}
