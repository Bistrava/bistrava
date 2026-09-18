export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  readingTime: string;
  status: "draft" | "published";
  updatedAt: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
};

export const guides: Guide[] = [
  {
    slug: "kaj-je-trda-voda",
    title: "Kaj je trda voda in zakaj nastaja vodni kamen",
    excerpt: "Razumljiva razlaga trdote, kalcija, magnezija in nastanka mineralnih oblog doma.",
    readingTime: "6 min branja",
    status: "draft",
    updatedAt: "2026-08-23",
    sections: [
      { title: "Trdota je merljiva lastnost vode", paragraphs: ["Trdota opisuje predvsem količino raztopljenih kalcijevih in magnezijevih ionov. Za primerjavo in dimenzioniranje opreme potrebujete številčno vrednost z jasno navedeno enoto."] },
      { title: "Kako nastane vodni kamen", paragraphs: ["Pri segrevanju ali izhlapevanju se del mineralov izloči v obloge. Zato so posledice pogosto najbolj vidne na grelnih elementih, armaturah in površinah, kjer voda zastaja ali se suši."] },
      { title: "Kdaj meriti", paragraphs: ["Vidne obloge so razlog za meritev, ne nadomestilo zanjo. Rezultat povežite s porabo, pretokom in mestom, kjer želite ukrepati."] },
    ],
  },
  {
    slug: "kako-izmeriti-trdoto-vode",
    title: "Kako izmeriti trdoto vode doma",
    excerpt: "Kaj zabeležiti pri testnem lističu, kapljičnem testu ali podatku lokalnega dobavitelja vode.",
    readingTime: "7 min branja",
    status: "draft",
    updatedAt: "2026-08-23",
    sections: [
      { title: "Izberite metodo z jasno enoto", paragraphs: ["Uporabite test z navedenim merilnim območjem in sledite času odčitavanja iz navodil. Pri podatku dobavitelja preverite oskrbovalno območje in datum."] },
      { title: "Zapišite okoliščine", paragraphs: ["Zabeležite mesto odvzema, vir vode, datum, rezultat in enoto. Tako bo meritev uporabna tudi pri kasnejši primerjavi."] },
      { title: "Kdaj rezultat preveriti", paragraphs: ["Ob nejasnem ali nepričakovanem rezultatu meritev ponovite. Pri lastnem viru ali drugih težavah je lahko potrebna širša ustrezna analiza."] },
    ],
  },
  {
    slug: "kako-deluje-mehcalec-vode",
    title: "Kako deluje ionski mehčalec vode",
    excerpt: "Ionska izmenjava, regeneracija s slanico in omejitve, ki jih je treba poznati pred nakupom.",
    readingTime: "8 min branja",
    status: "draft",
    updatedAt: "2026-08-23",
    sections: [
      { title: "Ionska izmenjava", paragraphs: ["Pri ionskem mehčanju smola veže predvsem kalcijeve in magnezijeve ione ter jih nadomešča z natrijevimi. To je drugačen način delovanja od rešitev, ki mineralov iz vode ne odstranjujejo."] },
      { title: "Regeneracija", paragraphs: ["Ko je sposobnost smole zmanjšana, krmiljenje izvede regeneracijo s slanico. Poraba soli in vode je odvisna od konkretnega sistema, nastavitev, trdote in porabe."] },
      { title: "Pogoji za delovanje", paragraphs: ["Naprava potrebuje ustrezen priključek, tlak, pretok, odtok, prostor za servis in pogosto električno napajanje. Končne zahteve določa proizvajalec."] },
    ],
  },
  {
    slug: "mehcalec-vode-za-hiso-vodic",
    title: "Mehčalec vode za hišo: podatki pred ponudbo",
    excerpt: "Kontrolni seznam za trdoto, porabo, kopalnice, pretok, prostor in priključke.",
    readingTime: "7 min branja",
    status: "draft",
    updatedAt: "2026-08-23",
    sections: [
      { title: "Poraba in sočasni pretok", paragraphs: ["Število oseb je samo izhodišče. Pomembna sta običajna mesečna poraba in največje število porabnikov, ki delujejo hkrati."] },
      { title: "Prostor za napravo", paragraphs: ["Izmerite širino, višino in globino ter pustite prostor za polnjenje soli, uporabo obvoda in servis."] },
      { title: "Priprava fotografij", paragraphs: ["Fotografirajte dovod, ventile, premer cevi, odtok in napajanje. Tako se obseg montaže lažje določi pred obiskom."] },
    ],
  },
  {
    slug: "mehcalec-vode-za-stanovanje-vodic",
    title: "Mehčalec vode za stanovanje: preverba izvedljivosti",
    excerpt: "Kako preveriti individualni dovod, prostor, odtok in pravila posega v večstanovanjski stavbi.",
    readingTime: "6 min branja",
    status: "draft",
    updatedAt: "2026-08-23",
    sections: [
      { title: "Kateri dovod oskrbuje stanovanje", paragraphs: ["Pred izbiro je treba potrditi, da dostopna cev oskrbuje želene porabnike in da poseg ne vpliva na skupno napeljavo brez ustreznega dogovora."] },
      { title: "Kompaktno ne pomeni brez zahtev", paragraphs: ["Tudi manjša naprava potrebuje varen odtok, napajanje, obvod in servisni dostop v skladu z navodili modela."] },
      { title: "Druga pot", paragraphs: ["Če centralna vgradnja ni izvedljiva, lahko preverite ciljno zaščito posamezne naprave. Učinek take rešitve mora biti opisan natančno in brez enačenja z ionskim mehčanjem."] },
    ],
  },
  {
    slug: "kako-dimenzionirati-mehcalec-vode",
    title: "Kako dimenzionirati mehčalec vode",
    excerpt: "Zakaj trdota, poraba, pretok in kapaciteta smole sodijo v isti izračun.",
    readingTime: "9 min branja",
    status: "draft",
    updatedAt: "2026-08-23",
    sections: [
      { title: "Vhodni podatki", paragraphs: ["Za dimenzioniranje potrebujete trdoto, količino porabljene vode in največji sočasni pretok. Pri modelu nato preverite potrjeno kapaciteto in delovni pretok."] },
      { title: "Regeneracija in rezerva", paragraphs: ["Cilj ni največja možna naprava, temveč primeren interval regeneracije in dovolj pretoka za dejansko uporabo. Izračun mora temeljiti na tehničnem listu modela."] },
      { title: "Končna preverba", paragraphs: ["Pred naročilom primerjajte priključke, tlak, odtok, napajanje, obvod, mere in servisne zahteve."] },
    ],
  },
  {
    slug: "montaza-mehcalca-vode-kontrolni-seznam",
    title: "Montaža mehčalca vode: kontrolni seznam",
    excerpt: "Od ogleda in ponudbe do montaže, nastavitve, preizkusa in predaje uporabniku.",
    readingTime: "8 min branja",
    status: "draft",
    updatedAt: "2026-08-23",
    sections: [
      { title: "Pred montažo", paragraphs: ["Potrdijo se model, obseg del, priključki, zaporni ventili, odtok, napajanje in možnost obvoda. Nejasnosti morajo biti zapisane v ponudbi."] },
      { title: "Med montažo", paragraphs: ["Montaža sledi navodilom naprave in dobri vodovodni praksi. Po priklopu se preverita tesnost in pravilna smer pretoka."] },
      { title: "Predaja", paragraphs: ["Uporabnik prejme razlago nastavitev, obvoda, polnjenja soli, opozoril in načrta vzdrževanja."] },
    ],
  },
  {
    slug: "vzdrzevanje-mehcalne-naprave",
    title: "Vzdrževanje mehčalne naprave",
    excerpt: "Kaj spremljati med redno uporabo in katere podatke pripraviti za servis.",
    readingTime: "7 min branja",
    status: "draft",
    updatedAt: "2026-08-23",
    sections: [
      { title: "Upoštevajte navodila modela", paragraphs: ["Intervali niso univerzalni. Vrsta soli, čiščenje, razkuževanje in servisni postopki morajo slediti uradnim navodilom konkretne naprave."] },
      { title: "Vodite osnovni zapis", paragraphs: ["Zapišite datume polnjenja, servisov, sprememb nastavitev in morebitnih kod. Nenadna sprememba porabe je podatek za pregled."] },
      { title: "Priprava servisnega zahtevka", paragraphs: ["Pošljite znamko, model, serijsko oznako, fotografije in jasen opis opaženega delovanja."] },
    ],
  },
  {
    slug: "sol-za-mehcalec-vode-vodic",
    title: "Sol za mehčalec vode: izbira in uporaba",
    excerpt: "Zakaj se sol uporablja, kaj preveriti na embalaži in kako spremljati porabo.",
    readingTime: "6 min branja",
    status: "draft",
    updatedAt: "2026-08-23",
    sections: [
      { title: "Vloga soli", paragraphs: ["Sol se uporablja za pripravo slanice med regeneracijo ionske smole. Ne gre za dodatek, ki bi ga bilo smiselno izbirati brez navodil naprave."] },
      { title: "Izbira", paragraphs: ["Preverite dovoljeno obliko in kakovost, pogoje shranjevanja ter težo pakiranja. Cena ni edini podatek."] },
      { title: "Poraba", paragraphs: ["Poraba je odvisna od trdote, porabe, nastavitev in zasnove naprave. Primerjajte jo šele ob potrjenih podatkih modela."] },
    ],
  },
  {
    slug: "mehcalec-ali-zascita-proti-kamnu",
    title: "Mehčalec ali druga zaščita proti vodnemu kamnu",
    excerpt: "Kako ločiti odstranjevanje trdote od rešitev, ki mineralov iz vode ne odstranijo.",
    readingTime: "8 min branja",
    status: "draft",
    updatedAt: "2026-08-23",
    sections: [
      { title: "Najprej definirajte učinek", paragraphs: ["Ionski mehčalec zmanjšuje trdoto z odstranjevanjem kalcijevih in magnezijevih ionov. Druge tehnologije imajo lahko drugačen cilj in jih ne opisujemo kot mehčalce, če teh ionov ne odstranijo."] },
      { title: "Celoten dom ali posamezna naprava", paragraphs: ["Centralna rešitev vpliva na ves oskrbovani razvod. Ciljna zaščita je omejena na določen porabnik ali odsek, zato je primerjava odvisna od vašega cilja."] },
      { title: "Dokazila in omejitve", paragraphs: ["Preverite uradno opisan način delovanja, merljive učinke, omejitve, zahtevano vzdrževanje in združljivost z napeljavo."] },
    ],
  },
];

export const featuredGuides = guides.slice(0, 3);

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
