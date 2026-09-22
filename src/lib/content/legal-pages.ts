import type { Metadata } from "next";

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
};

export type LegalPageContent = {
  title: string;
  kicker: string;
  intro: string;
  updatedAt: string;
  requiresBusinessDetails?: boolean;
  sections: LegalSection[];
};

export const legalPages: Record<LegalPageKey, LegalPageContent> = {
  "pravna-obvestila": {
    title: "Pravno obvestilo",
    kicker: "Podatki o spletnem mestu",
    intro:
      "Osnovne informacije o izdajatelju, gostovanju, vsebini in uporabi spletnega mesta Bistrava.",
    updatedAt: "22. september 2026",
    requiresBusinessDetails: true,
    sections: [
      {
        id: "ponudnik",
        title: "Podatki ponudnika",
        paragraphs: [
          "Pred začetkom prodaje morajo biti na tem mestu objavljeni popolni in preverjeni podatki pravne osebe ali samostojnega podjetnika, ki upravlja trgovino Bistrava.",
        ],
        items: [
          "Firma in pravnoorganizacijska oblika: [DOPOLNITI]",
          "Sedež in poslovni naslov: [DOPOLNITI]",
          "Matična številka: [DOPOLNITI]",
          "Davčna številka in status zavezanca za DDV: [DOPOLNITI]",
          "Registrski organ in datum vpisa: [DOPOLNITI]",
          "Zakoniti zastopnik: [DOPOLNITI]",
          "Javni e-poštni naslov in telefonska številka: [DOPOLNITI]",
          "Transakcijski račun in banka, kadar je zahtevano: [DOPOLNITI]",
        ],
        callout:
          "Ti podatki so obvezni pred sprejemanjem plačanih naročil. Ne uporabljajte začasnih ali osebnih podatkov brez izrecne potrditve upravljavca.",
      },
      {
        id: "izdajatelj",
        title: "Izdajatelj in tehnično gostovanje",
        paragraphs: [
          "Izdajatelj spletnega mesta je ponudnik, naveden v prejšnjem razdelku. Spletna aplikacija gostuje na infrastrukturi Vercel, podatkovne storitve pa uporablja prek Supabase. Natančne pogodbene vloge in lokacije obdelave so opisane v Politiki zasebnosti.",
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
    updatedAt: "22. september 2026",
    requiresBusinessDetails: true,
    sections: [
      {
        id: "veljavnost",
        title: "1. Ponudnik in veljavnost pogojev",
        paragraphs: [
          "Spletno trgovino Bistrava upravlja ponudnik, katerega popolni registrski podatki bodo pred začetkom prodaje objavljeni v Pravnem obvestilu. Ti pogoji veljajo za nakupe potrošnikov na spletnem mestu Bistrava v Republiki Sloveniji.",
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
          "Potrošnik lahko pri pogodbi, sklenjeni na daljavo, praviloma v 14 dneh od prevzema blaga sporoči, da odstopa od pogodbe, ne da bi navedel razlog. Postopek, stroški vračila, povračilo in zakonske izjeme so podrobno opisani na strani Vračila in povračila.",
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
          "Pritožbo lahko kupec pošlje prek kontaktnega obrazca. Bistrava potrdi prejem in jo obravnava brez nepotrebnega odlašanja. Odgovor vsebuje odločitev, obrazložitev ter nadaljnje možnosti, kadar zahtevku ni mogoče ugoditi.",
        ],
      },
      {
        id: "irps",
        title: "10. Izvensodno reševanje sporov",
        paragraphs: [
          "Pred začetkom prodaje mora Bistrava objaviti, katerega registriranega izvajalca izvensodnega reševanja potrošniških sporov priznava kot pristojnega, ali jasno navesti, da nobenega izvajalca ne priznava. Evropska platforma ODR je bila 20. julija 2025 ukinjena in povezava nanjo se ne uporablja več.",
        ],
        callout: "Odločitev ponudnika glede izvajalca IRPS: [DOPOLNITI].",
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

  dostava: {
    title: "Dostava",
    kicker: "Od naročila do vaših vrat",
    intro:
      "Pregled območja dostave, izračuna stroškov, rokov, sledenja in ravnanja ob poškodovani pošiljki.",
    updatedAt: "22. september 2026",
    sections: [
      {
        id: "obmocje",
        title: "Območje dostave",
        paragraphs: [
          "Bistrava je namenjena kupcem v Sloveniji. Točna območja, omejitve za oddaljene kraje ter možnost dostave v druge države se prikažejo na blagajni oziroma potrdijo pred sprejemom naročila.",
        ],
      },
      {
        id: "strosek",
        title: "Strošek dostave",
        paragraphs: [
          "Strošek se izračuna pred oddajo naročila glede na naslov, težo, mere, vrednost in izbrano storitev. Kupec pred plačilom vidi končni znesek. Brezplačna dostava velja samo, kadar je izrecno prikazana pri izdelku ali v košarici.",
        ],
      },
      {
        id: "rok",
        title: "Dobavni rok",
        paragraphs: [
          "Ocenjeni rok je prikazan pri razpoložljivi dostavni možnosti. Začne teči po potrditvi naročila oziroma prejemu plačila, kadar je zahtevano predplačilo. Delovni dnevi ne vključujejo sobot, nedelj in praznikov.",
          "Če rok ni posebej dogovorjen, bo blago dobavljeno brez nepotrebnega odlašanja in najpozneje v zakonskem roku. Ob zamudi kupec prejme obvestilo in lahko določi primeren dodatni rok; če tudi ta ni spoštovan, lahko uveljavlja pravice po veljavnih predpisih.",
        ],
      },
      {
        id: "vecji-izdelki",
        title: "Večji in težji izdelki",
        paragraphs: [
          "Mehčalne naprave, večja filtrirna ohišja in druga težka oprema lahko zahtevajo paletno dostavo, pomoč pri razkladanju ali predhodni dogovor. Dostava praviloma pomeni dostavo do naslova oziroma mesta, ki ga omogočajo prevoznikovi pogoji, ne pa tudi vnosa, priklopa ali montaže, razen če je to izrecno vključeno v naročilo.",
        ],
      },
      {
        id: "prevzem",
        title: "Prevzem in pregled pošiljke",
        paragraphs: [
          "Kupec naj ob prevzemu preveri število paketov in vidne poškodbe. Poškodovano embalažo naj fotografira ter poškodbo zabeleži pri prevozniku, če je mogoče. Manjkajočo vsebino, napačen izdelek ali skrito poškodbo naj čim prej sporoči Bistravi.",
          "Zapis pri prevozniku olajša obravnavo, vendar ne izključuje zakonskih pravic potrošnika. Ne pošiljajte poškodovanega izdelka na lastno pobudo, dokler ne prejmete navodil za varen prevoz.",
        ],
      },
      {
        id: "tveganje",
        title: "Tveganje med prevozom",
        paragraphs: [
          "Kadar prevoznika organizira Bistrava, tveganje poškodbe ali izgube praviloma preide na potrošnika, ko blago fizično prejme on ali pooblaščena tretja oseba. Za prevoznika, ki ga potrošnik naroči sam in ga Bistrava ni ponudila, veljajo zakonska pravila za tak primer.",
        ],
      },
      {
        id: "potrditev",
        title: "Podatki, ki jih je treba še potrditi",
        paragraphs: [
          "Pred aktivacijo plačil bodo objavljeni ime pogodbenega prevoznika, dejanske tarife, prag morebitne brezplačne dostave, merila za paletno dostavo in kontakt za reklamacije prevoza.",
        ],
        callout: "Prevoznik, cenik in operativni roki Bistrava: [DOPOLNITI].",
      },
    ],
  },

  placila: {
    title: "Plačila",
    kicker: "Jasno in varno plačilo",
    intro:
      "Na blagajni so prikazani samo dejansko omogočeni načini plačila, končni znesek in stanje naročila.",
    updatedAt: "22. september 2026",
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
          "plačilna kartica prek certificiranega ponudnika, ko bo omogočena,",
          "bančno nakazilo po predračunu, ko bo omogočeno,",
          "drug jasno označen način, prikazan pred oddajo naročila.",
        ],
      },
      {
        id: "varnost",
        title: "Varnost plačila",
        paragraphs: [
          "Bistrava po e-pošti ali telefonu ne zahteva celotne številke kartice, varnostne kode ali gesla za spletno banko. Kartični podatki se obdelujejo pri izbranem ponudniku plačil in se ne smejo zapisovati v običajna sporočila ali kontaktni obrazec.",
        ],
      },
      {
        id: "predracun",
        title: "Predračun in rok plačila",
        paragraphs: [
          "Če je omogočeno plačilo po predračunu, potrdilo vsebuje znesek, sklic, račun in rok. Naročilo gre v obdelavo po evidentiranem plačilu. Če plačilo ni prejeto v navedenem roku, se naročilo lahko samodejno prekliče.",
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
          "Odobreno povračilo se praviloma izvede z enakim plačilnim sredstvom, kot je bilo uporabljeno pri nakupu, razen če se stranki izrecno dogovorita drugače in potrošnik zaradi tega nima stroškov. Čas knjiženja pri banki ali kartični shemi je lahko daljši od časa, v katerem Bistrava povračilo odredi.",
        ],
      },
      {
        id: "ponudnik-placil",
        title: "Ponudnik plačil",
        paragraphs: [
          "Pred vključitvijo spletnega plačevanja bodo tukaj navedeni ponudnik, sprejete kartice oziroma načini, pravila preverjanja in povezava do njegovega obvestila o zasebnosti.",
        ],
        callout: "Ponudnik plačil in aktivni načini: [DOPOLNITI].",
      },
    ],
  },

  vracila: {
    title: "Vračila in povračila",
    kicker: "Odstop od spletnega nakupa",
    intro:
      "Jasen postopek za 14-dnevni odstop, vračilo blaga, povračilo plačila in ločeno uveljavljanje neskladnosti.",
    updatedAt: "22. september 2026",
    sections: [
      {
        id: "pravica",
        title: "14-dnevna pravica do odstopa",
        paragraphs: [
          "Potrošnik lahko pri pogodbi, sklenjeni na daljavo, praviloma v 14 dneh od dneva, ko on ali pooblaščena tretja oseba prejme blago, obvesti Bistravo, da odstopa od pogodbe, ne da bi navedel razlog. Pri več kosih iz istega naročila, dostavljenih ločeno, rok praviloma začne teči s prejemom zadnjega kosa.",
          "Za pravočasen odstop zadošča, da potrošnik pred iztekom roka pošlje nedvoumno izjavo prek kontaktnega obrazca ali na uradni kontakt, ki bo objavljen pred začetkom prodaje.",
        ],
      },
      {
        id: "vrnitev",
        title: "Vrnitev izdelka",
        paragraphs: [
          "Po obvestilu o odstopu mora potrošnik blago poslati ali izročiti brez nepotrebnega odlašanja in najpozneje v 14 dneh, razen če Bistrava ponudi prevzem. Izdelek naj bo varno zapakiran z vsemi deli, dodatki, navodili in dokazilom o nakupu.",
          "Neposredni strošek vračila praviloma nosi potrošnik, razen če Bistrava v konkretnem primeru prevzame strošek ali potrošnika pred nakupom o tem ni ustrezno obvestila. Za izdelke, ki jih zaradi narave ni mogoče vrniti po običajni pošti, bo pred nakupom objavljena ocena stroška vračila.",
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
          "Če je izdelek poškodovan, napačen ali nima dogovorjenih lastnosti, naj kupec uveljavlja neskladnost blaga. Tak zahtevek se obravnava ločeno od odstopa brez razloga in potrošniku ne nalaga stroškov, ki jih mora po zakonu nositi prodajalec.",
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
          "Blaga ne pošiljajte na naslov ponudnika gostovanja, skladišča dobavitelja ali na naslov, ki ni izrecno potrjen za vračila. Pred odpremo zahtevajte navodila in referenco vračila.",
        ],
        callout: "Uradni kontakt in naslov za vračila Bistrava: [DOPOLNITI].",
      },
    ],
  },

  garancija: {
    title: "Garancija in skladnost",
    kicker: "Pravice po nakupu",
    intro:
      "Zakonska skladnost blaga in morebitna komercialna garancija proizvajalca sta dve ločeni podlagi.",
    updatedAt: "22. september 2026",
    sections: [
      {
        id: "skladnost",
        title: "Neskladnost blaga",
        paragraphs: [
          "Blago mora ustrezati opisu, količini, kakovosti, funkcionalnosti, združljivosti in drugim dogovorjenim lastnostim ter običajnim pričakovanjem za takšno vrsto blaga. Če ni skladno, lahko potrošnik uveljavlja zakonske zahtevke pri prodajalcu.",
        ],
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
    updatedAt: "22. september 2026",
    requiresBusinessDetails: true,
    sections: [
      {
        id: "upravljavec",
        title: "1. Upravljavec",
        paragraphs: [
          "Upravljavec osebnih podatkov je ponudnik spletne trgovine Bistrava. Njegova firma, naslov in javni kontakt za vprašanja glede zasebnosti bodo objavljeni pred začetkom prodaje.",
        ],
        callout: "Upravljavec in kontakt za varstvo podatkov: [DOPOLNITI].",
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
          "podatki o plačilu in statusu transakcije; celotne kartične številke Bistrava ne shranjuje,",
          "komunikacija, reklamacije, vračila in dokazila, ki jih pošljete,",
          "tehnični podatki: IP, naprava, dnevniški zapisi, varnostni dogodki in izbira piškotkov,",
          "marketinški podatki samo ob ustrezni pravni podlagi oziroma soglasju.",
        ],
      },
      {
        id: "nameni",
        title: "3. Nameni in pravne podlage",
        paragraphs: [
          "Podatke obdelujemo za izvedbo naročila in ukrepe pred sklenitvijo pogodbe, izpolnitev davčnih in potrošniških obveznosti, obravnavo zahtevkov, varovanje spletnega mesta in uveljavljanje pravnih zahtevkov. Analitika in oglaševalsko merjenje se vključita le skladno z vašo izbiro zasebnosti.",
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
          "Podatke prejmejo samo osebe in izvajalci, ki jih potrebujejo za svoj del storitve: ponudnik gostovanja Vercel, podatkovna platforma Supabase, ponudnik transakcijske e-pošte Resend, prihodnji ponudnik plačil, izbrani prevoznik, računovodstvo ter pristojni organi, kadar to zahteva zakon.",
          "Z obdelovalci se sklenejo ustrezni dogovori. Seznam se posodobi ob vsaki vključitvi novega ponudnika.",
        ],
      },
      {
        id: "prenosi",
        title: "5. Prenosi zunaj EGP",
        paragraphs: [
          "Nekateri tehnološki ponudniki imajo povezane družbe ali infrastrukturo zunaj Evropskega gospodarskega prostora. Kadar pride do prenosa, mora temeljiti na sklepu o ustreznosti ali drugih ustreznih zaščitnih ukrepih, na primer standardnih pogodbenih klavzulah. Natančna nastavitev regij in pogodbenih podlag bo navedena po dokončni konfiguraciji storitev.",
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
    updatedAt: "22. september 2026",
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
          "Če so Google Analytics, Google Ads ali druge merilne storitve konfigurirane, je neobvezno shranjevanje privzeto zavrnjeno. Vključi se po izrecni izbiri uporabnika. Izbiro lahko kadar koli spremenite z gumbom Nastavitve zasebnosti v nogi.",
        ],
      },
      {
        id: "seznam",
        title: "Končni seznam tehnologij",
        paragraphs: [
          "Pred vklopom merjenja bo tukaj objavljen seznam imen, ponudnikov, namenov in trajanja posameznih piškotkov oziroma podobnih tehnologij.",
        ],
        callout: "Končni popis piškotkov po produkcijskem pregledu: [DOPOLNITI].",
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
