import type { Metadata } from "next";
import { createDeliveryPageContent, orderPreparationText, standardShippingText } from "@/lib/content/delivery";
import { companyDetails, companyPostalAddress, companyReturnsAddress, irpsStatement } from "@/lib/content/company";

export type LegalPageKey =
  | "pravna-obvestila"
  | "splosni-pogoji-poslovanja"
  | "dostava"
  | "placila"
  | "vracila"
  | "garancija"
  | "zasebnost"
  | "piskotki";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
  callout?: string;
  table?: { caption: string; headings: string[]; rows: string[][] };
  links?: Array<{ label: string; href: string }>;
};

export type LegalPageContent = {
  title: string;
  kicker: string;
  intro: string;
  updatedAt: string;
  requiresBusinessDetails?: boolean;
  highlights?: Array<{ label: string; value: string; detail?: string; href?: string }>;
  sections: LegalSection[];
};

export const legalPages: Record<LegalPageKey, LegalPageContent> = {
  "pravna-obvestila": {
    title: "Pravno obvestilo",
    kicker: "Podatki o spletnem mestu",
    intro:
      "Osnovne informacije o izdajatelju, gostovanju, vsebini in uporabi spletnega mesta Bistrava.",
    updatedAt: "18. oktober 2026",
    sections: [
      {
        id: "ponudnik",
        title: "Podatki ponudnika",
        paragraphs: [
          `Spletno trgovino Bistrava upravlja ${companyDetails.fullName}`,
        ],
        items: [
          `Firma: ${companyDetails.fullName}`,
          `Skrajšana firma: ${companyDetails.shortName}`,
          `Pravnoorganizacijska oblika: ${companyDetails.legalForm}`,
          `Sedež in poslovni naslov: ${companyPostalAddress}`,
          `Matična številka (MŠ): ${companyDetails.registrationNumber}`,
          `Davčna številka (DŠ): ${companyDetails.taxNumber}`,
          `Identifikacijska številka za DDV: ${companyDetails.vatNumber}; zavezanec za DDV`,
          `Registrski organ: ${companyDetails.registrationAuthority}; datum vpisa: ${companyDetails.registrationDateSl}`,
          `Zakoniti zastopnik: ${companyDetails.legalRepresentative}`,
          `E-pošta: ${companyDetails.email}; telefon: ${companyDetails.phone}`,
          "Podatke za bančno nakazilo prejmete po e-pošti po potrditvi naročila.",
        ],
      },
      {
        id: "irps",
        title: "Izvensodno reševanje potrošniških sporov",
        paragraphs: [irpsStatement],
      },
      {
        id: "izdajatelj",
        title: "Izdajatelj in tehnično gostovanje",
        paragraphs: [
          "Izdajatelj spletnega mesta je ponudnik, naveden v prejšnjem razdelku. Spletno mesto gosti Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaka, Ciper (Hostinger). Podatkovne storitve zagotavlja Supabase. Podrobnosti o obdelavi osebnih podatkov so opisane v Politiki zasebnosti.",
        ],
      },
      {
        id: "vsebina",
        title: "Vsebina in informacije o izdelkih",
        paragraphs: [
          "Bistrava si prizadeva objavljati razumljive in preverjene podatke. Fotografije, tehnične lastnosti in navodila proizvajalcev se lahko spremenijo. Za prodajno pogodbo veljajo podatki, ki so kupcu prikazani in potrjeni ob oddaji naročila.",
          "Vodniki, primerjave in konfigurator so informativna pomoč pri izbiri. Ne nadomeščajo analize vode, projektiranja vodovodne napeljave ali navodil proizvajalca.",
        ],
      },
      {
        id: "pravice",
        title: "Avtorske pravice in znamke",
        paragraphs: [
          "Besedila, grafična podoba, logotip in izvirne informativne grafike Bistrava so varovani. Imena in znamke proizvajalcev pripadajo njihovim imetnikom in so uporabljeni za prepoznavanje izdelkov.",
          "Kopiranje, predelava ali komercialna uporaba vsebin brez dovoljenja ni dovoljena, razen kadar zakon določa drugače.",
        ],
      },
      {
        id: "povezave",
        title: "Zunanje povezave in dosegljivost",
        paragraphs: [
          "Zunanje povezave vodijo na strani tretjih oseb, katerih vsebine in razpoložljivosti Bistrava ne nadzoruje. Občasne prekinitve spletnega mesta zaradi vzdrževanja ali dogodkov zunaj razumnega nadzora ponudnika so mogoče.",
        ],
      },
    ],
  },

  "splosni-pogoji-poslovanja": {
    title: "Splošni pogoji poslovanja",
    kicker: "Pravila spletnega nakupa",
    intro:
      "Pogoji urejajo uporabo trgovine, oddajo naročila, plačilo, dostavo, potrošniške pravice in reševanje reklamacij.",
    updatedAt: "24. oktober 2026",
    sections: [
      {
        id: "veljavnost",
        title: "1. Ponudnik in veljavnost pogojev",
        paragraphs: [
          `Spletno trgovino Bistrava upravlja ${companyDetails.fullName}, ${companyPostalAddress}, matična številka ${companyDetails.registrationNumber}, ID za DDV ${companyDetails.vatNumber}. Podrobni podatki ponudnika so objavljeni v Pravnem obvestilu. Ti pogoji veljajo za nakupe potrošnikov na spletnem mestu Bistrava v Republiki Sloveniji.`,
          "Kupec mora imeti pred oddajo naročila možnost prebrati in shraniti veljavno različico pogojev. Potrditev naročila in pogojev se kupcu posreduje na trajnem nosilcu, praviloma po e-pošti.",
        ],
      },
      {
        id: "izdelki",
        title: "2. Izdelki in tehnična primernost",
        paragraphs: [
          "Bistvene lastnosti, cena, razpoložljivost, dobavni rok in morebitne omejitve so navedeni na strani izdelka oziroma v košarici. Slike lahko zaradi zaslona ali sprememb embalaže nekoliko odstopajo, vendar takšno odstopanje ne sme spremeniti bistvenih lastnosti izdelka.",
          "Pri filtrih, mehčalnih napravah in opremi za vodovod mora kupec pred nakupom preveriti namen uporabe, kakovost vode, dimenzije, priključke, tlak, pretok, zahteve glede odtoka in električnega napajanja ter združljivost z obstoječo napeljavo.",
        ],
      },
      {
        id: "cene",
        title: "3. Cene in davki",
        paragraphs: [
          "Vse prodajne cene so izražene v evrih. Končna cena, DDV in strošek dostave so kupcu prikazani pred oddajo naročila. Cena, ki velja za pogodbo, je cena v potrditvi naročila, razen očitne tehnične napake, o kateri ponudnik kupca nemudoma obvesti.",
          "Časovno omejene akcije veljajo v objavljenem obdobju in do razprodaje zalog. Pri znižanju cene se prejšnja cena prikazuje skladno z veljavnimi pravili o označevanju cen.",
        ],
      },
      {
        id: "narocilo",
        title: "4. Postopek naročila",
        paragraphs: [
          "Kupec izbere izdelek in količino, pregleda košarico, vnese podatke za dostavo, izbere razpoložljiv način dostave in plačila ter pred oddajo preveri povzetek. Do končne oddaje lahko podatke popravi ali izdelek odstrani.",
          "Po oddaji kupec prejme elektronsko potrdilo o prejemu naročila. Prodajna pogodba je sklenjena, ko ponudnik naročilo sprejme in to potrdi kupcu. Ponudnik lahko naročilo zavrne, kadar izdelka ni mogoče dobaviti, plačila ni mogoče preveriti ali obstaja očitna napaka v podatkih; kupca o tem obvesti in vrne že prejeta plačila.",
        ],
      },
      {
        id: "zaloga",
        title: "5. Razpoložljivost",
        paragraphs: [
          "Podatek o zalogi se redno posodablja, vendar lahko pride do sočasnih naročil ali napake pri dobavitelju. Če izdelek po oddaji naročila ni na voljo, Bistrava kupcu brez nepotrebnega odlašanja ponudi nov rok, ustrezno zamenjavo ali preklic z vračilom plačila. Zamenjava se izvede le z izrecnim soglasjem kupca.",
        ],
      },
      {
        id: "placilo-dostava",
        title: "6. Plačilo in dostava",
        paragraphs: [
          "Veljajo načini plačila in dostave, ki so dejansko prikazani na blagajni. Podrobnosti so objavljene na straneh Plačila in Dostava, ki sta sestavni del teh pogojev.",
        ],
      },
      {
        id: "odstop",
        title: "7. Odstop od pogodbe in vračila",
        paragraphs: [
          "Potrošnik lahko pri pogodbi, sklenjeni na daljavo, praviloma v 14 dneh od prevzema blaga sporoči, da odstopa od pogodbe, ne da bi navedel razlog. Neposredni strošek vračila nerabljenega in popolnega izdelka v stanju ob dobavi krije ponudnik. Postopek, stroški vračila, povračilo in zakonske izjeme so podrobno opisani na strani Vračila in povračila.",
        ],
      },
      {
        id: "skladnost",
        title: "8. Skladnost blaga in garancija",
        paragraphs: [
          "Ponudnik odgovarja za neskladnost blaga po pravilih Zakona o varstvu potrošnikov. Komercialna garancija proizvajalca je dodatna pravica in ne omejuje zakonskih pravic potrošnika.",
          "Kupec naj neskladnost opiše čim natančneje ter priloži številko naročila, fotografije in druge razpoložljive dokaze. Navodila so objavljena na strani Garancija in skladnost.",
        ],
      },
      {
        id: "pritozbe",
        title: "9. Pritožbe in podpora",
        paragraphs: [
          `Pritožbo lahko kupec pošlje prek kontaktnega obrazca ali na ${companyDetails.email}. Bistrava potrdi prejem in jo obravnava brez nepotrebnega odlašanja. Odgovor vsebuje odločitev, obrazložitev ter nadaljnje možnosti, kadar zahtevku ni mogoče ugoditi.`,
        ],
      },
      {
        id: "irps",
        title: "10. Izvensodno reševanje sporov",
        paragraphs: [
          irpsStatement,
          "Evropska platforma ODR je bila 20. julija 2025 ukinjena in povezava nanjo se ne uporablja več.",
        ],
      },
      {
        id: "pravo",
        title: "11. Pravo in spremembe pogojev",
        paragraphs: [
          "Za pogodbe se uporablja pravo Republike Slovenije, pri čemer izbira prava potrošniku ne odvzema varstva, ki mu pripada po prisilnih predpisih. Stranki si prizadevata spor najprej rešiti sporazumno; za sodno reševanje je pristojno sodišče po veljavnih pravilih.",
          "Za posamezno naročilo velja različica pogojev, s katero je bil kupec seznanjen ob oddaji. Poznejše spremembe ne učinkujejo za nazaj.",
        ],
      },
    ],
  },

  dostava: createDeliveryPageContent([]),

  placila: {
    title: "Plačila",
    kicker: "Jasno in varno plačilo",
    intro:
      "Na blagajni so prikazani samo dejansko omogočeni načini plačila, končni znesek in stanje naročila.",
    updatedAt: "25. oktober 2026",
    sections: [
      {
        id: "valuta",
        title: "Valuta, cena in potrdilo",
        paragraphs: [
          "Plačila se izvajajo v evrih. Pred oddajo naročila so prikazani cena izdelkov, DDV, popusti, dostava in končni znesek. Po oddaji kupec prejme povzetek naročila; račun se izda skladno z davčnimi pravili.",
        ],
      },
      {
        id: "nacini",
        title: "Razpoložljivi načini",
        paragraphs: [
          "Veljaven je samo način, ki ga kupec lahko izbere na blagajni. Možni načini se lahko med izdelki razlikujejo zaradi vrednosti, dobavnega roka ali preverjanja naročila.",
        ],
        items: [
          "bančno nakazilo v EUR, kadar je omogočeno na blagajni,",
            "podatke prejemnika in računa samodejno pošljemo po e-pošti po potrditvi naročila,",
          "plačilo s kartico (Mastercard, Visa in druge plačilne kartice) prek plačilnega sistema Stripe, kadar je omogočeno na blagajni,",
          "plačilo po povzetju trenutno ni na voljo.",
        ],
      },
      {
        id: "varnost",
        title: "Varnost plačila",
        paragraphs: [
          "Bančno nakazilo opravite v svoji banki. Podatke kartice vpišete samo v varen obrazec plačilnega sistema Stripe na blagajni. Bistrava po e-pošti ali telefonu ne zahteva gesla za spletno banko, enkratnih kod ali celotnih podatkov plačilne kartice. Teh podatkov ne vpisujte v sporočila ali kontaktni obrazec.",
        ],
      },
      {
        id: "kartica",
        title: "Plačilo s kartico",
        paragraphs: [
          "Številko kartice, datum veljavnosti in varnostno kodo obdela Stripe Payments Europe, Limited (Irska). Ti podatki ne prehajajo prek strežnikov Bistrave in jih Bistrava ne hrani; v administraciji vidimo samo stanje plačila in znesek. Banka izdajateljica lahko zahteva dodatno potrditev, na primer v svoji mobilni aplikaciji (3-D Secure).",
          "Kartica je bremenjena ob potrditvi plačila na blagajni. Naročilo je potrjeno, ko plačilni sistem potrdi uspešno plačilo; potrditev prejmete po e-pošti. Če plačilo ne uspe, kartica ni bremenjena, naročilo pa ostane shranjeno do ponovnega poskusa ali preklica. Morebitno povračilo izvedemo na isto kartico.",
          "Naročilo, ki čaka na plačilo s kartico, lahko plačate tudi prek osebne povezave, ki jo prejmete po e-pošti. Povezava odpre varno plačilno stran za točno to naročilo in znesek; ne posredujte je drugim.",
        ],
      },
      {
        id: "predracun",
        title: "Kako plačati z bančnim nakazilom",
        paragraphs: [
            "Po potrditvi naročila na e-poštni naslov naročila samodejno pošljemo ime prejemnika, IBAN, banko, BIC/SWIFT, kadar je naveden, točen znesek in referenco naročila. Bančni podatki niso prikazani na blagajni ali potrditveni strani. Nakazilo opravite v svoji banki; oddaja naročila sama ne izvede plačila.",
            "V namen nakazila vpišite referenco naročila. Po opravljenem nakazilu odgovorite na prejeto e-sporočilo in priložite potrdilo o nakazilu z referenco naročila, da pospešimo obdelavo. Naročilo bo dokončno potrjeno ob prejemu potrdila o nakazilu. Prejem sredstev preverimo ločeno. Če ste že plačali, nakazila ne ponavljajte.",
          orderPreparationText,
          standardShippingText,
        ],
      },
      {
        id: "napake",
        title: "Neuspešno ali dvojno plačilo",
        paragraphs: [
          "Če plačilo ni uspelo, kupec naj pred ponovitvijo preveri stanje naročila in izpis banke. Ob morebitni dvojni bremenitvi naj prek kontaktnega obrazca pošlje številko naročila in dokazilo brez občutljivih kartičnih podatkov.",
        ],
      },
      {
        id: "vracilo",
        title: "Povračila",
        paragraphs: [
          "Odobreno povračilo se praviloma izvede z enakim plačilnim sredstvom, kot je bilo uporabljeno pri nakupu, razen če se stranki izrecno dogovorita drugače in potrošnik zaradi tega nima stroškov. Čas knjiženja pri banki je lahko daljši od časa, v katerem Bistrava povračilo odredi.",
        ],
      },
      {
        id: "ponudnik-placil",
        title: "Pomoč pri nakazilu",
        paragraphs: [
          `Če navodil niste prejeli ali želite preveriti prejem plačila, pišite na ${companyDetails.email} in navedite referenco naročila. Ne pošiljajte gesla ali dostopnih kod za spletno banko.`,
        ],
        callout: "Naročilo se pripravi po potrjenem prejemu bančnega nakazila.",
      },
    ],
  },

  vracila: {
    title: "Vračila in povračila",
    kicker: "Odstop od spletnega nakupa",
    intro:
      "Jasen postopek za 14-dnevni odstop, vračilo blaga, povračilo plačila in ločeno uveljavljanje neskladnosti.",
    updatedAt: "24. oktober 2026",
    highlights: [
      { label: "Rok za odstop", value: "14 dni", detail: "Od prejema izdelka, brez navedbe razloga.", href: "#pravica" },
      { label: "Strošek vračila", value: "Krije Bistrava", detail: "Za nerabljen in popoln izdelek v stanju ob dobavi.", href: "#vrnitev" },
      { label: "Povračilo kupnine", value: "V 14 dneh", detail: "Od obvestila o odstopu, ko prejmemo vrnjeni izdelek.", href: "#povracilo" },
      { label: "Okvara ali napaka", value: "2 leti", detail: "Zakonska odgovornost za neskladnost; stroške nosi Bistrava.", href: "#neskladnost" },
    ],
    sections: [
      {
        id: "pravica",
        title: "14-dnevna pravica do odstopa",
        paragraphs: [
          "Potrošnik lahko pri pogodbi, sklenjeni na daljavo, praviloma v 14 dneh od dneva, ko on ali pooblaščena tretja oseba prejme blago, obvesti Bistravo, da odstopa od pogodbe, ne da bi navedel razlog. Pri več kosih iz istega naročila, dostavljenih ločeno, rok praviloma začne teči s prejemom zadnjega kosa.",
          `Za pravočasen odstop zadošča, da potrošnik pred iztekom roka pošlje nedvoumno izjavo prek kontaktnega obrazca ali na ${companyDetails.email}.`,
        ],
      },
      {
        id: "vrnitev",
        title: "Vrnitev izdelka",
        paragraphs: [
          "Po obvestilu o odstopu mora potrošnik blago poslati ali izročiti brez nepotrebnega odlašanja in najpozneje v 14 dneh, razen če Bistrava ponudi prevzem. Izdelek naj bo varno zapakiran z vsemi deli, dodatki, navodili in dokazilom o nakupu.",
          `Bistrava krije neposredni strošek vračila, če je izdelek vrnjen nerabljen, popoln in v stanju, v katerem je bil dostavljen, z vsemi deli, dodatki in navodili. Pred pošiljanjem nas obvestite na ${companyDetails.email}: dogovorimo se za prevzem pri vas ali vam po prejemu izdelka povrnemo dokazan strošek standardne pošiljke.`,
          "Če izdelek ni vrnjen v takem stanju, na primer ker je bil vgrajen, priklopljen na vodovod ali uporabljen, odstop od pogodbe ostane veljaven, vendar neposredni strošek vračila nosi potrošnik, Bistrava pa lahko od povračila odšteje zmanjšano vrednost po spodnjih pravilih.",
        ],
      },
      {
        id: "pregled",
        title: "Pregled in zmanjšana vrednost",
        paragraphs: [
          "Potrošnik sme z blagom ravnati toliko, kolikor je potrebno za ugotovitev njegove narave, lastnosti in delovanja, podobno kot v fizični trgovini. Odgovarja za zmanjšano vrednost, ki je posledica ravnanja prek tega obsega.",
          "Vgradnja, priklop na vodovod, pretok vode skozi filter, uporaba kartuše ali onesnaženje materiala lahko vplivajo na vrednost in na možnost varnega ponovnega trženja. To se presoja posamično in ne pomeni samodejne izgube zakonske pravice.",
        ],
      },
      {
        id: "povracilo",
        title: "Povračilo plačila",
        paragraphs: [
          "Bistrava povrne prejeta plačila, vključno s stroškom najcenejše ponujene standardne dostave, brez nepotrebnega odlašanja in najpozneje v 14 dneh od prejema obvestila o odstopu. Dodatni strošek dražje dostave po izbiri kupca se ne vrača.",
          "Povračilo se lahko zadrži do prejema vrnjenega blaga ali dokler potrošnik ne predloži dokazila, da ga je poslal, kar nastopi prej. Uporabi se enako plačilno sredstvo, razen ob izrecnem drugačnem dogovoru brez dodatnega stroška za potrošnika.",
          "V praksi povračilo odredimo, ko prejmemo vrnjeni izdelek ali dokazilo o pošiljanju, najpozneje pa v 14 dneh od prejema obvestila o odstopu. Če vrnjeni izdelek prispe po tem roku, povračilo odredimo brez odlašanja ob njegovem prejemu.",
        ],
      },
      {
        id: "izjeme",
        title: "Zakonske izjeme",
        paragraphs: [
          "Pravica do odstopa ne velja v primerih, ki jih določa zakon, na primer za blago, izdelano po natančnih navodilih potrošnika ali prilagojeno njegovim osebnim potrebam, ter za zapečateno blago, ki zaradi varovanja zdravja ali higiene ni primerno za vračilo, če je potrošnik po dostavi odprl pečat.",
          "Izjema se uporabi samo, če so izpolnjeni zakonski pogoji in je bil kupec o njej jasno obveščen pred naročilom. Standardnega izdelka ni mogoče razglasiti za izdelek po meri samo zato, ker je bil naročen pri dobavitelju.",
        ],
      },
      {
        id: "neskladnost",
        title: "Poškodba ali neskladnost ni običajno vračilo",
        paragraphs: [
          "Če je izdelek poškodovan, napačen, okvarjen ali nima dogovorjenih lastnosti, naj kupec uveljavlja neskladnost blaga. Tak zahtevek se obravnava ločeno od odstopa brez razloga, ni omejen na 14 dni in potrošniku ne nalaga stroškov, ki jih mora po zakonu nositi prodajalec.",
        ],
        items: [
          "Bistrava odgovarja za neskladnost, ki obstaja ob dobavi in se pokaže v dveh letih od dobave.",
          "Neskladnost sporočite v dveh mesecih od dneva, ko ste jo ugotovili, z natančnim opisom, številko naročila in po možnosti fotografijami.",
          "Če se neskladnost pokaže v 30 dneh od dobave, lahko odstopite od pogodbe in zahtevate vračilo kupnine, ne da bi prej zahtevali popravilo ali zamenjavo.",
          "Sicer lahko zahtevate popravilo ali zamenjavo, pod zakonskimi pogoji pa tudi znižanje kupnine ali odstop od pogodbe.",
          "Stroške pošiljanja, prevzema in vzpostavitve skladnosti nosi Bistrava.",
        ],
      },
      {
        id: "obrazec",
        title: "Vzorec izjave o odstopu",
        paragraphs: [
          "»Obveščam vas, da odstopam od prodajne pogodbe za naslednje blago: [izdelek]. Naročilo: [številka]. Naročeno dne: [datum]. Prejeto dne: [datum]. Ime in naslov potrošnika: [podatki]. Datum: [datum].«",
          "Uporaba tega besedila ni obvezna; zadostuje katera koli jasna izjava, iz katere je razvidna odločitev o odstopu in naročilo, na katero se nanaša.",
        ],
      },
      {
        id: "naslov",
        title: "Naslov za vračilo",
        paragraphs: [
          `Izdelke vrnite na spodnji naslov. Za pomoč glede pakiranja ali prevoza pišite na ${companyDetails.email} in navedite številko naročila.`,
        ],
        callout: `Naslov za vračila: ${companyDetails.shortName}, ${companyReturnsAddress}. Kontakt za vračila: ${companyDetails.email}, ${companyDetails.phone}.`,
      },
    ],
  },

  garancija: {
    title: "Garancija in skladnost",
    kicker: "Pravice po nakupu",
    intro:
      "Zakonska skladnost blaga in morebitna komercialna garancija proizvajalca sta dve ločeni podlagi.",
    updatedAt: "24. oktober 2026",
    sections: [
      {
        id: "skladnost",
        title: "Neskladnost blaga",
        paragraphs: [
          "Blago mora ustrezati opisu, količini, kakovosti, funkcionalnosti, združljivosti in drugim dogovorjenim lastnostim ter običajnim pričakovanjem za takšno vrsto blaga. Če ni skladno, lahko potrošnik uveljavlja zakonske zahtevke pri prodajalcu.",
          "Prodajalec odgovarja za neskladnost, ki obstaja ob dobavi in se pokaže v dveh letih od dobave. Potrošnik jo sporoči v dveh mesecih od dneva, ko jo je ugotovil. Pravice in stroški so podrobneje opisani na strani Vračila in povračila.",
        ],
        links: [{ label: "Vračila in povračila", href: "/vracila#neskladnost" }],
      },
      {
        id: "postopek",
        title: "Postopek prijave",
        paragraphs: [
          "Kupec naj navede številko naročila, izdelek, datum ugotovitve, opis težave in okoliščine uporabe ter priloži fotografije ali video, kadar to pomaga. Izdelka naj ne razstavlja in naj ne izvaja posegov, ki niso predvideni v navodilih.",
        ],
      },
      {
        id: "garancija",
        title: "Komercialna garancija",
        paragraphs: [
          "Če proizvajalec ali prodajalec ponuja garancijo, so trajanje, območje, postopek in izključitve navedeni v garancijskem listu ali na strani izdelka. Garancija ne zmanjšuje zakonskih pravic zaradi neskladnosti.",
        ],
      },
    ],
  },

  zasebnost: {
    title: "Politika zasebnosti",
    kicker: "Vaši podatki pod vašim nadzorom",
    intro:
      "Pojasnjujemo, katere podatke Bistrava obdeluje, zakaj jih potrebuje, komu jih posreduje in kako lahko uveljavljate svoje pravice.",
    updatedAt: "24. oktober 2026",
    sections: [
      {
        id: "upravljavec",
        title: "1. Upravljavec",
        paragraphs: [
          `Upravljavec osebnih podatkov je ${companyDetails.fullName}, ${companyPostalAddress}, matična številka ${companyDetails.registrationNumber}. Za vprašanja glede zasebnosti in uveljavljanje pravic pišite na ${companyDetails.email} ali pokličite ${companyDetails.phone}.`,
        ],
        links: [{ label: companyDetails.email, href: `mailto:${companyDetails.email}` }],
      },
      {
        id: "podatki",
        title: "2. Katere podatke obdelujemo",
        paragraphs: [
          "Obseg je odvisen od tega, kako uporabljate spletno mesto. Ne zbiramo podatkov, ki za izbrani namen niso potrebni.",
        ],
        items: [
          "kontaktni podatki: ime, e-pošta in telefonska številka,",
          "podatki za naročilo: naslov, poštna številka, kraj, država, izdelki in količine,",
          "podatki o vodi in prostoru, ki jih prostovoljno vnesete v obrazec ali konfigurator,",
          "podatki o bančnem nakazilu in statusu plačila; gesel in dostopnih kod za spletno banko Bistrava ne zbira,",
          "komunikacija, reklamacije, vračila in dokazila, ki jih pošljete,",
          "tehnični podatki: IP, naprava, dnevniški zapisi, varnostni dogodki in izbira piškotkov,",
          "marketinški podatki samo ob ustrezni pravni podlagi oziroma soglasju.",
        ],
      },
      {
        id: "nameni",
        title: "3. Nameni in pravne podlage",
        paragraphs: [
          "Podatke obdelujemo za izvedbo naročila in ukrepe pred sklenitvijo pogodbe, izpolnitev davčnih in potrošniških obveznosti, obravnavo zahtevkov, varovanje spletnega mesta in uveljavljanje pravnih zahtevkov. Statistično merjenje se vključi samo, če je konfigurirano in izberete »Dovoli statistiko« ali »Dovoli vse«. Oglaševalsko merjenje se vključi samo, če izberete »Dovoli vse«; z njim merimo učinkovitost naših oglasov in konverzije, kot sta oddano naročilo ali povpraševanje.",
        ],
        items: [
          "pogodba: ko obdelava omogoča nakup, dostavo, podporo ali vračilo,",
          "zakonska obveznost: računi, davčne evidence, varstvo potrošnikov in odzivi pristojnim organom,",
          "zakoniti interes: varnost, preprečevanje zlorab, nujni tehnični dnevniki in obramba zahtevkov,",
          "soglasje: neobvezna analitika, oglaševanje ali neposredno trženje, kjer je potrebno.",
        ],
      },
      {
        id: "prejemniki",
        title: "4. Prejemniki in obdelovalci",
        paragraphs: [
          "Podatke prejmejo samo osebe in izvajalci, ki jih potrebujejo za svoj del storitve: ponudnik spletnega gostovanja Hostinger International Ltd. (Ciper), podatkovna platforma Supabase, ponudnik e-pošte LWS, ponudnik transakcijske e-pošte Resend, kadar je ta storitev omogočena, banke pri izvedbi nakazila, izbrani prevoznik, računovodstvo ter pristojni organi, kadar to zahteva zakon.",
          "Pri plačilu s kartico podatke kartice, znesek, e-poštni naslov in podatke za preprečevanje zlorab obdeluje ponudnik plačilnih storitev Stripe Payments Europe, Limited (Irska). Bistrava podatkov kartice ne prejme.",
          "Če izberete »Dovoli vse«, podatke o obisku in konverzijah prejme tudi Instaon SRL (Belgija), ki upravlja orodje za oglaševalsko merjenje Shown, ter oglaševalska omrežja, katerih oznake Shown naloži za naše kampanje, na primer Google, Microsoft, Meta, X, TikTok ali LinkedIn.",
          "Z obdelovalci se sklenejo ustrezni dogovori. Seznam se posodobi ob vsaki vključitvi novega ponudnika.",
        ],
      },
      {
        id: "prenosi",
        title: "5. Prenosi zunaj EGP",
        paragraphs: [
          "Spletno mesto gosti Hostinger International Ltd. s sedežem na Cipru v Evropski uniji. Za podatkovni projekt Supabase je izbrana regija Frankfurt v Nemčiji. Izbira regije ne pomeni, da vsa povezana obdelava ostane v Evropskem gospodarskem prostoru. Hostingerjev dogovor o obdelavi podatkov za prenose v države brez ustrezne ravni varstva določa standardne pogodbene klavzule EU, seznam njegovih podobdelovalcev pa je del istega dogovora. Pri drugih ponudnikih se upoštevajo njihove dejanske nastavitve in veljavne pogodbene podlage.",
          "Stripe lahko podatke o plačilu obdeluje tudi v ZDA; za take prenose uporablja okvir EU-ZDA za zasebnost podatkov in standardne pogodbene klavzule.",
          "Instaon SRL navaja, da prenose zunaj EU izvaja s standardnimi pogodbenimi klavzulami. Oglaševalska omrežja, ki se naložijo po izbiri »Dovoli vse«, lahko podatke obdelujejo tudi zunaj EGP, na primer v ZDA, po svojih pravilih.",
        ],
        links: [
          { label: "Hostinger: dogovor o obdelavi podatkov", href: "https://www.hostinger.com/legal/dpa" },
          { label: "Shown: politika zasebnosti", href: "https://shown.io/en/privacy" },
          { label: "Stripe: politika zasebnosti", href: "https://stripe.com/privacy" },
        ],
      },
      {
        id: "hramba",
        title: "6. Rok hrambe",
        paragraphs: [
          "Podatke hranimo le toliko časa, kolikor je potrebno za namen, nato jih izbrišemo ali anonimiziramo, razen če zakon zahteva daljšo hrambo. Računi in računovodske listine se hranijo po davčnih predpisih; podatki o naročilih, reklamacijah in sporih do poteka ustreznih rokov; neuspešna povpraševanja omejen čas za odgovor in dokazovanje komunikacije; soglasje do preklica ter toliko časa, kolikor je potrebno za dokazovanje njegove veljavnosti.",
        ],
      },
      {
        id: "pravice",
        title: "7. Vaše pravice",
        paragraphs: [
          "Pod pogoji iz zakonodaje lahko zahtevate dostop, popravek, izbris, omejitev obdelave in prenosljivost podatkov ter ugovarjate obdelavi na podlagi zakonitega interesa. Soglasje lahko kadar koli prekličete, ne da bi to vplivalo na zakonitost pred preklicem.",
          "Če menite, da obdelava ni zakonita, lahko vložite pritožbo pri Informacijskem pooblaščencu Republike Slovenije. Pred tem vas vabimo, da se obrnete na Bistravo, da lahko zahtevo hitro preverimo.",
        ],
      },
      {
        id: "avtomatizacija",
        title: "8. Avtomatizirano odločanje",
        paragraphs: [
          "Konfigurator izdelkov uporablja vnesene tehnične podatke za razvrstitev izdelkov, vendar ne sprejema odločitev s pravnim ali podobno pomembnim učinkom. Kupec lahko vedno pregleda razloge in izbere drug izdelek.",
        ],
      },
      {
        id: "varnost-spremembe",
        title: "9. Varnost in spremembe politike",
        paragraphs: [
          "Uporabljamo nadzor dostopa, šifrirane povezave, ločene strežniške ključe in omejevanje dostopa po vlogah. Noben sistem ni popolnoma varen, zato postopke redno preverjamo.",
          "Ob večji spremembi namena, prejemnikov ali tehnologije se politika posodobi in označi z novim datumom. Kadar zakon zahteva novo soglasje, ga bomo pridobili pred novo obdelavo.",
        ],
      },
    ],
  },

  piskotki: {
    title: "Piškotki in nastavitve zasebnosti",
    kicker: "Izbira pred merjenjem",
    intro:
      "Nujne funkcije delujejo brez oglaševalskega soglasja; neobvezno merjenje se vključi šele po vaši izbiri.",
    updatedAt: "24. oktober 2026",
    sections: [
      {
        id: "nujni",
        title: "Nujni podatki",
        paragraphs: [
          "Spletno mesto lahko shrani podatke, ki so potrebni za varnost, košarico, sejo in zapomnitev izbire zasebnosti. Brez njih osnovne funkcije trgovine ne morejo zanesljivo delovati.",
        ],
      },
      {
        id: "analitika",
        title: "Analitika in oglaševanje",
        paragraphs: [
          "Google Analytics oziroma Google Tag Manager se naložita samo, če sta konfigurirana in izberete »Dovoli statistiko« ali »Dovoli vse«. Pred izbiro in pri izbiri »Samo bistveno« se ti oznaki ne naložita. »Dovoli statistiko« velja samo za statistiko obiska; oglaševalsko shranjevanje, uporaba podatkov za oglase in prilagajanje oglasov ostanejo zavrnjeni.",
          "Z izbiro »Dovoli vse« dovolite tudi oglaševalsko merjenje. Takrat se naloži orodje Shown (Instaon SRL, Belgija), ki glede na naše oglaševalske kampanje naloži oznake oglaševalskih omrežij, na primer Google Ads, Microsoft, Meta, X, TikTok ali LinkedIn, in jim sporoča obiske ter konverzije, kot sta oddano naročilo ali povpraševanje. Ob tej izbiri se neposredno naloži tudi oznaka Google Ads (Google Ireland Limited), s katero merimo oddana naročila iz naših oglasov. Ta omrežja lahko v vašem brskalniku shranijo svoje piškotke in identifikatorje.",
          "Izbira je shranjena v lokalnem pomnilniku brskalnika pod imenom bistrava-consent-v2. Starejša izbira, ki je združevala statistiko in oglaševanje, ne velja kot dovoljenje za novo različico. Izbiro lahko kadar koli spremenite z gumbom Nastavitve zasebnosti v nogi. Če izberete manj, kot ste dovolili prej, shranimo novo izbiro in stran znova naložimo, da se že naložene oznake odstranijo. Košarica in druge bistvene funkcije ostanejo na voljo brez neobveznih dovoljenj.",
        ],
      },
      {
        id: "seznam",
        title: "Seznam piškotkov in lokalnega shranjevanja",
        paragraphs: [
          "Spodaj je navedeno shranjevanje, ki ga uporablja aplikacija. Posamezen vnos nastane ob uporabi opisane funkcije; vsi vnosi se ne ustvarijo ob vsakem obisku. Lokalni pomnilnik ostane v vašem brskalniku in nima samodejnega roka poteka; odstranite ga lahko z izbrisom podatkov spletnega mesta v nastavitvah brskalnika.",
          "Piškotek za naročilo nastane šele po uspešni oddaji naročila. Prijavni piškotki in administrativne nastavitve so namenjeni osebju. Rok prijavnega piškotka ni zagotovilo trajanja prijave; veljavnost seje preverja strežnik, ob odjavi pa se prijavni piškotki odstranijo.",
          "Brez konfiguriranih identifikatorjev Google Analytics oziroma Google Tag Manager aplikacija teh zunanjih oznak ne naloži, tudi če izberete statistiko. Imena in roke piškotkov oglaševalskih omrežij določajo ta omrežja in so odvisni od kampanj, povezanih v orodju Shown; opisani so v njihovih politikah piškotkov.",
        ],
        table: {
          caption: "Shranjevanje aplikacije Bistrava",
          headings: ["Ime in vrsta", "Ponudnik", "Namen in uporaba", "Trajanje"],
          rows: [
            ["bistrava-cart-v1 (lokalni pomnilnik)", "Bistrava", "Izdelki in količine v košarici ter pregled sprememb cen ali zaloge.", "Brez samodejnega poteka; do izbrisa podatkov spletnega mesta."],
            ["bistrava-consent-v2 (lokalni pomnilnik)", "Bistrava", "Shrani vašo izbiro zasebnosti po izbiri v obvestilu ali nastavitvah.", "Do spremembe izbire ali izbrisa podatkov spletnega mesta; brez samodejnega poteka."],
            ["bistrava-order-<referenca> (piškotek)", "Bistrava", "Zasebni dostop do potrditve posameznega naročila po uspešni oddaji; branje iz JavaScripta je onemogočeno.", "30 dni."],
            ["sb-<projekt>-auth-token, lahko z deli .0, .1 itd. (piškotki)", "Bistrava / Supabase", "Prijava in varovanje administrativne seje.", "Do 400 dni od nastavitve ali osvežitve; odstranitev ob odjavi."],
            ["__stripe_mid, __stripe_sid (piškotka)", "Stripe", "Preprečevanje zlorab pri plačilu s kartico; nastaneta šele, ko se na blagajni naloži obrazec za kartico.", "__stripe_mid do 1 leta, __stripe_sid 30 minut."],
            ["Piškotki in identifikatorji orodja Shown ter povezanih oglaševalskih omrežij", "Instaon SRL (Shown) in oglaševalska omrežja", "Merjenje obiskov, konverzij in učinkovitosti oglasov; naložijo se samo po izbiri »Dovoli vse«.", "Po pravilih posameznega ponudnika; do preklica izbire in izbrisa podatkov spletnega mesta."],
            ["bistrava-admin-language-v1 (lokalni pomnilnik)", "Bistrava", "Zapomni si jezik administracije, ko ga osebje spremeni.", "Brez samodejnega poteka; do izbrisa podatkov spletnega mesta."],
            ["bistrava-admin-product-draft-v1:<izdelek> (lokalni pomnilnik)", "Bistrava", "Lokalni osnutek izdelka samo ob izrecnem shranjevanju v predoglednem načinu administracije.", "Do ponastavitve osnutka ali izbrisa podatkov spletnega mesta; brez samodejnega poteka."],
          ],
        },
      },
    ],
  },
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
