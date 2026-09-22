import type { Metadata } from "next";

export type SpecialistPageKey =
  | "mehcalne-naprave"
  | "trda-voda"
  | "mehcalec-vode-za-hiso"
  | "mehcalec-vode-za-stanovanje"
  | "montaza-mehcalca-vode"
  | "servis-mehcalnih-naprav"
  | "sol-za-mehcalec-vode"
  | "test-trdote-vode";

export type SpecialistPageContent = {
  path: `/${SpecialistPageKey}`;
  kicker: string;
  title: string;
  description: string;
  intro: string;
  leadTitle: string;
  lead: string;
  points: Array<{ title: string; text: string }>;
  stepsTitle: string;
  steps: string[];
  note: string;
  related: Array<{ label: string; href: string }>;
};

export const specialistPages: Record<
  SpecialistPageKey,
  SpecialistPageContent
> = {
  "mehcalne-naprave": {
    path: "/mehcalne-naprave",
    kicker: "Tehnologija brez bližnjic",
    title: "Mehčalne naprave za nadzor trdote vode",
    description:
      "Kako delujejo mehčalne naprave, katere podatke potrebujete za izbiro in kaj preveriti pred montažo.",
    intro:
      "Mehčalna naprava se izbere glede na izmerjeno trdoto, porabo gospodinjstva, potreben pretok in pogoje na glavnem vodovodnem priključku.",
    leadTitle: "Kaj naprava dejansko naredi?",
    lead:
      "Pri ionskem mehčanju smola iz vode odstranjuje predvsem kalcijeve in magnezijeve ione ter jih nadomešča z natrijevimi. Ko se sposobnost smole zmanjša, se izvede regeneracija s slanico. Magnetne ali elektronske naprave, ki kalcija in magnezija ne odstranijo, zato niso enakovredne ionskemu mehčalcu.",
    points: [
      {
        title: "Dimenzioniranje",
        text: "Pomembni so trdota, dnevna poraba in največji sočasni pretok - ne samo število oseb.",
      },
      {
        title: "Montažni pogoji",
        text: "Običajno se preverijo glavni dovod, odtok, napajanje, tlak, prostor in možnost obvoda.",
      },
      {
        title: "Vzdrževanje",
        text: "Načrt vključuje ustrezno sol, redne preglede, čiščenje in postopke iz navodil proizvajalca.",
      },
    ],
    stepsTitle: "Pred primerjavo modelov",
    steps: [
      "Izmerite skupno trdoto vode ali pridobite dovolj svež podatek dobavitelja vode.",
      "Zapišite število oseb, kopalnic in običajno mesečno porabo.",
      "Fotografirajte dovod, odtok, električno vtičnico in razpoložljiv prostor.",
      "Primerjajte potrjen pretok, kapaciteto, regeneracijo in servis - ne le cene.",
    ],
    note:
      "Končna izbira modela je smiselna šele, ko so tehnični podatki konkretnega izdelka potrjeni pri dobavitelju.",
    related: [
      { label: "Izbira mehčalca", href: "/izbira-mehcalca" },
      { label: "Montaža mehčalca", href: "/montaza-mehcalca-vode" },
      { label: "Mehčalci vode", href: "/mehcalci-vode" },
    ],
  },
  "trda-voda": {
    path: "/trda-voda",
    kicker: "Najprej meritev",
    title: "Trda voda: kaj pomeni in kako jo izmerimo",
    description:
      "Razlaga trdote vode, enote °dH in podatkov, ki jih potrebujete pred izbiro mehčalca.",
    intro:
      "Trdota opisuje predvsem vsebnost kalcijevih in magnezijevih ionov. Za izbiro opreme potrebujete številčno vrednost in dovolj jasno merilno metodo.",
    leadTitle: "Zakaj občutek ni dovolj",
    lead:
      "Vidne obloge so dober razlog za meritev, niso pa natančen podatek za dimenzioniranje. Hitra meritev je uporabna za orientacijo; pri zahtevnejšem viru vode ali drugih težavah je lahko potrebna ustrezna analiza.",
    points: [
      {
        title: "Enota °dH",
        text: "Na slovenskem trgu se trdota pogosto navaja v nemških stopinjah. Pri pretvorbah mora biti izvorna enota vedno jasna.",
      },
      {
        title: "Podatek dobavitelja",
        text: "Podatek lokalnega dobavitelja je uporaben, če se nanaša na pravo oskrbovalno območje in obdobje.",
      },
      {
        title: "Domači test",
        text: "Testne lističe ali kapljični test uporabljajte natančno po navodilih in znotraj navedenega območja.",
      },
    ],
    stepsTitle: "Podatki za uporaben rezultat",
    steps: [
      "Zapišite kraj, poštno številko in vir vode.",
      "Zabeležite rezultat, enoto, datum in uporabljeno metodo.",
      "Če rezultat močno odstopa, meritev ponovite ali preverite z drugo metodo.",
      "Rezultat povežite s porabo in pretokom gospodinjstva.",
    ],
    note:
      "Konfigurator sprejme vrednost v °dH. Če trdote ne poznate, vas usmeri v meritev ali svetovanje in ne ugiba modela.",
    related: [
      { label: "Test trdote vode", href: "/test-trdote-vode" },
      { label: "Mehčalci vode", href: "/mehcalci-vode" },
      { label: "Odprite konfigurator", href: "/izbira-mehcalca" },
    ],
  },
  "mehcalec-vode-za-hiso": {
    path: "/mehcalec-vode-za-hiso",
    kicker: "Centralna rešitev za hišo",
    title: "Mehčalec vode za hišo",
    description:
      "Kako izbrati in pripraviti montažo mehčalca vode za enodružinsko ali večjo hišo.",
    intro:
      "V hiši se mehčalec praviloma načrtuje na glavnem dovodu, zato mora zagotoviti primeren pretok tudi ob sočasni uporabi več porabnikov.",
    leadTitle: "Od gospodinjstva do tehnične izbire",
    lead:
      "Število oseb je uporaben začetek, vendar ne nadomesti podatkov o trdoti, porabi, številu kopalnic in največjem pretoku. Pomembna sta tudi razpoložljiv prostor in varen dostop za polnjenje soli ter servis.",
    points: [
      { title: "Poraba", text: "Uporabite račune ali oceno porabe in zabeležite večje porabnike vode." },
      { title: "Pretok", text: "Več kopalnic in sočasna uporaba lahko zahtevata večji potrjeni delovni pretok." },
      { title: "Montaža", text: "Preverite dovod, odtok, napajanje, tlak, obvod in možnost varnega odvajanja regeneracijske vode." },
    ],
    stepsTitle: "Priprava ponudbe za hišo",
    steps: [
      "Meritev trdote in osnovni podatki o viru vode.",
      "Število oseb, kopalnic ter mesečna poraba, če je znana.",
      "Fotografije prostora in mere razpoložljive površine.",
      "Pregled tehničnih podatkov, ponudba in šele nato termin montaže.",
    ],
    note: "Pri lastnem vodnem viru je lahko pred izbiro potrebna širša analiza vode.",
    related: [
      { label: "Izbira mehčalca", href: "/izbira-mehcalca" },
      { label: "Montaža", href: "/montaza-mehcalca-vode" },
      { label: "Servis", href: "/servis-mehcalnih-naprav" },
    ],
  },
  "mehcalec-vode-za-stanovanje": {
    path: "/mehcalec-vode-za-stanovanje",
    kicker: "Kompaktna in izvedljiva rešitev",
    title: "Mehčalec vode za stanovanje",
    description:
      "Kaj preveriti pri izbiri kompaktnega mehčalca vode za stanovanje in skupne napeljave.",
    intro:
      "V stanovanju je poleg porabe ključno, ali je posamezni dovod dostopen in ali so na voljo odtok, napajanje ter dovolj prostora za napravo in servis.",
    leadTitle: "Najprej preverite izvedljivost",
    lead:
      "Razporeditev napeljav v večstanovanjski stavbi lahko omeji mesto vgradnje. Poseg mora biti usklajen z dejanskim dovodom stanovanja in pravili upravljanja skupnih delov.",
    points: [
      { title: "Malo prostora", text: "Zabeležite natančno višino, širino, globino in prostor za odpiranje ter polnjenje." },
      { title: "Priključek", text: "Potrdite, da izbrano mesto res oskrbuje celotno stanovanje in je servisno dostopno." },
      { title: "Odtok", text: "Način odvajanja regeneracijske vode mora biti izvedljiv in skladen z navodili naprave." },
    ],
    stepsTitle: "Podatki za pregled stanovanja",
    steps: [
      "Fotografije dovoda, števca, ventilov in najbližjega odtoka.",
      "Natančne mere prostora in premer priključka, če je znan.",
      "Trdota vode, število oseb in kopalnic.",
      "Preverba izvedljivosti pred izbiro konkretnega modela.",
    ],
    note:
      "Če centralna vgradnja ni izvedljiva, se lahko preveri ciljno zaščito posameznega porabnika, vendar ta ni nujno enakovredna mehčanju celotnega stanovanja.",
    related: [
      { label: "Izbira mehčalca", href: "/izbira-mehcalca" },
      { label: "Montaža", href: "/montaza-mehcalca-vode" },
      { label: "Kontakt", href: "/kontakt" },
    ],
  },
  "montaza-mehcalca-vode": {
    path: "/montaza-mehcalca-vode",
    kicker: "Načrtovana izvedba",
    title: "Montaža mehčalca vode",
    description:
      "Potek priprave, ponudbe, vgradnje, nastavitve in predaje mehčalne naprave.",
    intro:
      "Kakovost montaže se začne pred prihodom monterja: s potrjenim modelom, jasnimi priključki in dogovorjenim obsegom del.",
    leadTitle: "Kaj mora biti znano pred posegom",
    lead:
      "Preverijo se glavni dovod, zaporni ventili, tlak, premer cevi, odtok, električno napajanje, prostor za obvod in servis. Morebitna dodatna vodovodna ali gradbena dela morajo biti navedena v ponudbi.",
    points: [
      { title: "Predpriprava", text: "Meritve in fotografije zmanjšajo tveganje nepredvidenih priključkov ali pomanjkanja prostora." },
      { title: "Nastavitev", text: "Naprava se nastavi glede na potrjeno trdoto in navodila proizvajalca." },
      { title: "Predaja", text: "Uporabnik potrebuje razlago obvoda, polnjenja soli, nadzora in rednega vzdrževanja." },
    ],
    stepsTitle: "Šest korakov montaže",
    steps: [
      "Analiza potreb in pogojev na lokaciji.",
      "Izbira preverjene naprave in pisna ponudba.",
      "Priprava priključkov ter dogovor o obsegu del.",
      "Montaža naprave, obvoda, odtoka in napajanja.",
      "Nastavitev, preizkus tesnosti in delovanja.",
      "Predaja navodil in načrta vzdrževanja.",
    ],
    note: "Končni obseg in cena montaže sta vedno odvisna od dejanskega stanja na lokaciji.",
    related: [
      { label: "Zahtevajte ponudbo", href: "/kontakt?vrsta=montaza" },
      { label: "Servis naprav", href: "/servis-mehcalnih-naprav" },
      { label: "Izbira mehčalca", href: "/izbira-mehcalca" },
    ],
  },
  "servis-mehcalnih-naprav": {
    path: "/servis-mehcalnih-naprav",
    kicker: "Vzdrževanje skozi življenjsko dobo",
    title: "Servis mehčalnih naprav",
    description:
      "Kaj vključuje pregled mehčalne naprave in katere podatke pripraviti pred servisnim zahtevkom.",
    intro:
      "Servisni postopek je odvisen od znamke, modela, starosti, načina delovanja in opaženih simptomov. Intervali se določijo po navodilih proizvajalca in dejanski uporabi.",
    leadTitle: "Pregled temelji na podatkih",
    lead:
      "Pred posegom je koristno zabeležiti model, serijsko oznako, leto vgradnje, zadnji servis, nastavljeno trdoto in opis spremembe delovanja. Fotografije zaslona in priključkov pomagajo pri pripravi.",
    points: [
      { title: "Redni pregled", text: "Vizualna kontrola, nastavitve in postopki iz uradnega servisnega načrta." },
      { title: "Potrošni material", text: "Vrsta soli in druga sredstva morajo biti združljivi z navodili konkretne naprave." },
      { title: "Nujna stanja", text: "Ob iztekanju vode zaprite ustrezen ventil in sledite navodilom naprave oziroma pokličite usposobljeno pomoč." },
    ],
    stepsTitle: "Kaj pošljete v servisni zahtevek",
    steps: [
      "Znamko, model in serijsko oznako.",
      "Naslov lokacije in leto montaže.",
      "Opis težave, prikazano kodo in fotografije.",
      "Podatek o zadnjem vzdrževanju in uporabljeni soli.",
    ],
    note: "Razpoložljivost rezervnih delov in obseg posega se potrdita pred izvedbo.",
    related: [
      { label: "Pošljite servisni zahtevek", href: "/kontakt?vrsta=servis" },
      { label: "Sol za mehčalec", href: "/sol-za-mehcalec-vode" },
      { label: "Pogosta vprašanja", href: "/pogosta-vprasanja" },
    ],
  },
  "sol-za-mehcalec-vode": {
    path: "/sol-za-mehcalec-vode",
    kicker: "Potrošni material za regeneracijo",
    title: "Sol za mehčalec vode",
    description:
      "Vloga regeneracijske soli, pravilno polnjenje in podatki, ki jih preverite pri svoji napravi.",
    intro:
      "Pri ionskem mehčalcu se sol uporablja za pripravo slanice, s katero se regenerira ionska smola. Izberite vrsto in kakovost, ki jo dovoljuje proizvajalec naprave.",
    leadTitle: "Poraba ni enaka v vsakem domu",
    lead:
      "Na porabo vplivajo trdota vode, količina smole, nastavitev regeneracije, poraba gospodinjstva in učinkovitost konkretnega sistema. Brez teh podatkov ni pošteno navajati univerzalne porabe.",
    points: [
      { title: "Prava vrsta", text: "Preverite obliko, čistost, pakiranje in zahteve v uradnih navodilih naprave." },
      { title: "Pravilno polnjenje", text: "Posoda naj ostane čista; ravnajte po oznakah in navodilih, ne po splošnih domnevah." },
      { title: "Nadzor porabe", text: "Nenavadna sprememba porabe je razlog za pregled nastavitev, dovoda ali delovanja naprave." },
    ],
    stepsTitle: "Pred naročilom soli",
    steps: [
      "Potrdite znamko in model mehčalca.",
      "Preverite dovoljeno vrsto soli v navodilih.",
      "Izberite pakiranje, ki ga lahko varno shranite in prenašate.",
      "Vodite preprost zapis porabe in datumov polnjenja.",
    ],
    note: "Cena in dobavljivost posameznega pakiranja bosta objavljeni šele po potrditvi dobaviteljskega cenika.",
    related: [
      { label: "Servis mehčalcev", href: "/servis-mehcalnih-naprav" },
      { label: "Katalog v pripravi", href: "/mehcalci-vode#katalog" },
      { label: "Kontakt", href: "/kontakt" },
    ],
  },
  "test-trdote-vode": {
    path: "/test-trdote-vode",
    kicker: "Meritev pred izbiro",
    title: "Test trdote vode",
    description:
      "Kako izvesti orientacijski test trdote vode in rezultat uporabiti pri izbiri mehčalca.",
    intro:
      "Dober test poda rezultat v jasno navedeni enoti in znotraj merilnega območja. Navodila konkretnega testa imajo prednost pred splošnimi nasveti.",
    leadTitle: "Kaj zapišete ob meritvi",
    lead:
      "Zabeležite datum, mesto odvzema, vir vode, uporabljeno metodo, rezultat in enoto. Če uporabljate testni listič, barvo primerjajte v času, ki ga določa proizvajalec.",
    points: [
      { title: "Orientacijski test", text: "Uporaben je za začetno usmeritev, če je merilno območje primerno in so navodila upoštevana." },
      { title: "Kapljični test", text: "Omogoča drugačen način odčitavanja; vedno preverite pretvorbo in enoto rezultata." },
      { title: "Analiza vode", text: "Pri lastnem viru ali drugih zaznanih težavah je lahko potrebna širša ustrezna analiza." },
    ],
    stepsTitle: "Od rezultata do izbire",
    steps: [
      "Izvedite test po navodilih in rezultat zapišite v °dH ali navedite drugo enoto.",
      "Dodajte podatek o številu oseb, porabi in kopalnicah.",
      "Preverite prostor, priključek, odtok in napajanje.",
      "Uporabite konfigurator za profil rešitve ali zahtevajte strokovni pregled.",
    ],
    note: "Bistrava ne ugiba trdote na podlagi poštne številke, če zanesljiv podatek ni na voljo.",
    related: [
      { label: "Kaj je trda voda", href: "/trda-voda" },
      { label: "Odprite konfigurator", href: "/izbira-mehcalca" },
      { label: "Mehčalne naprave", href: "/mehcalne-naprave" },
    ],
  },
};

export function specialistMetadata(key: SpecialistPageKey): Metadata {
  const page = specialistPages[key];
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      locale: "sl_SI",
      url: page.path,
      title: page.title,
      description: page.description,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
  };
}
