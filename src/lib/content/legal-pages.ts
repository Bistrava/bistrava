import type { Metadata } from "next";

export type LegalPageKey =
  | "pravna-obvestila"
  | "dostava"
  | "placila"
  | "vracila"
  | "garancija"
  | "zasebnost"
  | "piskotki";

export const legalPages: Record<LegalPageKey, { title: string; intro: string; sections: Array<{ title: string; text: string }> }> = {
  "pravna-obvestila": { title: "Pravno obvestilo", intro: "Osnutek informacij o upravljavcu in uporabi spletnega mesta.", sections: [{ title: "Podatki upravljavca", text: "Pravna oseba, registrski podatki, naslov in davčna številka še niso bili posredovani. Pred javno objavo jih mora potrditi pravni pregled." }, { title: "Vsebina spletnega mesta", text: "Tehnične vsebine so informativne. Ponudba nastane šele s potrjenimi podatki, obsegom, ceno in pogoji." }] },
  dostava: { title: "Dostava", intro: "Osnutek pogojev dostave za izdelke, ki bodo pozneje aktivirani za spletni nakup.", sections: [{ title: "Območje in načini", text: "Prevozniki, območje, stroški in roki še niso potrjeni. Na strani ne obljubljamo roka, dokler logistični pogoji niso določeni." }, { title: "Naprave z montažo", text: "Dostava mehčalne naprave je lahko del dogovorjene montaže in se opredeli v individualni ponudbi." }] },
  placila: { title: "Plačila", intro: "Osnutek informacij o prihodnjih načinih plačila.", sections: [{ title: "Spletna plačila", text: "Ponudnik plačil in sprejeti načini še niso izbrani. Spletni nakup ostaja onemogočen do tehnične in pravne potrditve." }, { title: "Individualne ponudbe", text: "Plačilni pogoji za opremo z montažo bodo navedeni v potrjeni ponudbi." }] },
  vracila: { title: "Vračila in odstop od pogodbe", intro: "Pravni osnutek, ki pred objavo zahteva pregled za slovenski trg.", sections: [{ title: "Potrošniške pravice", text: "Končni postopek, roki, izjeme in kontaktni podatki še niso potrjeni. Ta osnutek ni nadomestilo za veljavno pravno besedilo." }, { title: "Izdelki in storitve", text: "Pogoji se lahko razlikujejo med standardnim blagom, opremo po naročilu in že izvedeno storitvijo montaže; določiti jih mora pravni pregled." }] },
  garancija: { title: "Garancija in skladnost", intro: "Na enem mestu bodo objavljeni samo potrjeni pogoji konkretnega izdelka.", sections: [{ title: "Garancijski rok", text: "Roka ne navajamo brez uradnih pogojev dobavitelja oziroma proizvajalca za posamezen model." }, { title: "Dokumentacija", text: "Ob aktivaciji izdelka bodo navedeni navodila, pogoji, serijska identifikacija in postopek uveljavljanja, kadar so potrjeni." }] },
  zasebnost: { title: "Obvestilo o zasebnosti", intro: "Začasni povzetek obdelave podatkov iz kontaktnih in konfiguracijskih obrazcev.", sections: [{ title: "Namen obdelave", text: "Ime, kontakt, lokacijski podatek in vsebino povpraševanja uporabljamo za obravnavo zahteve, pripravo odgovora in evidenco soglasja." }, { title: "Hramba in prejemniki", text: "Podatki se bodo hranili v Supabase in po potrebi posredovali Resendu za transakcijsko e-pošto. Končni roki hrambe, pravna podlaga, upravljavec in kontakti še zahtevajo pravni pregled." }, { title: "Vaše pravice", text: "Končni kontakt za uveljavljanje pravic bo objavljen po potrditvi podatkov upravljavca." }] },
  piskotki: { title: "Piškotki in nastavitve zasebnosti", intro: "Bistveni piškotki delujejo brez trženjskega soglasja; analitika in oglaševanje sta privzeto zavrnjena.", sections: [{ title: "Bistveno delovanje", text: "Spletno mesto lahko uporabi nujne nastavitve za varnost, sejo in zapis vaše izbire zasebnosti." }, { title: "Analitika in oglaševanje", text: "Če so identifikatorji GTM, GA4 ali Google Ads nastavljeni, Consent Mode v2 pred uporabnikovo izbiro pošlje privzeto zavrnjeno stanje. Analitično in oglaševalsko shranjevanje se odobri šele po izrecni izbiri uporabnika." }, { title: "Sprememba izbire", text: "Izbiro lahko ponastavite z gumbom Nastavitve zasebnosti v nogi, ko bo pravni pregled seznama piškotkov zaključen." }] },
};

export function legalMetadata(key: LegalPageKey): Metadata {
  const page = legalPages[key];
  return {
    title: page.title,
    description: page.intro,
    alternates: { canonical: `/${key}` },
    robots: { index: false, follow: true },
  };
}
