export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  readingTime: string;
  status: "draft" | "published";
  updatedAt: string;
  comparison: {
    title: string;
    caption: string;
    columns: string[];
    rows: string[][];
  };
  sections: Array<{ title: string; paragraphs: string[] }>;
};

export const guides: Guide[] = [
  {
    slug: "kaj-je-trda-voda",
    title: "Kaj je trda voda in zakaj nastaja vodni kamen",
    excerpt: "Razumljiva razlaga trdote, kalcija, magnezija in nastanka mineralnih oblog doma.",
    readingTime: "8 min branja",
    status: "published",
    updatedAt: "2026-09-22",
    comparison: {
      title: "Primerjava znakov trde vode",
      caption: "Vidni znaki so uporabna usmeritev, natančno stanje pa potrdi meritev.",
      columns: ["Kaj opazite", "Možna razlaga", "Kako preveriti", "Smiseln naslednji korak"],
      rows: [
        ["Bele sledi na armaturah", "Minerali ostanejo po sušenju kapljic", "Izmerite vhodno trdoto", "Primerjajte rešitve za celoten dom"],
        ["Obloge v kuhalniku", "Segrevanje pospeši izločanje mineralov", "Primerjajte stanje in rezultat testa", "Preverite mehčanje ali ciljno zaščito"],
        ["Motno steklo prhe", "Ponavljajoče sušenje trde vode", "Ponovite meritev na hladni pipi", "Ocenite pogostost čiščenja in območje zaščite"],
        ["Brez vidnih oblog", "Trdota je lahko nižja ali posledice manj opazne", "Ne sklepajte brez meritve", "Ukrepajte le, če obstaja jasna potreba"],
      ],
    },
    sections: [
      {
        title: "Trdota je merljiva lastnost vode",
        paragraphs: [
          "Trdota vode opisuje predvsem količino raztopljenih kalcijevih in magnezijevih ionov. Minerali pridejo v vodo med njenim prehajanjem skozi kamnine in tla, zato se trdota razlikuje med vodnimi viri in oskrbovalnimi območji. Trda voda sama po sebi ni isto kot onesnažena voda; izraz opisuje mineralno sestavo.",
          "V Sloveniji se trdota pogosto navaja v nemških stopinjah, označenih z °dH, srečate pa lahko tudi mmol/l ali mg/l CaCO₃. Pri primerjavi rezultatov vedno preverite enoto. Številka brez enote ni dovolj za izbiro opreme ali primerjavo dveh meritev.",
        ],
      },
      {
        title: "Kako nastane vodni kamen",
        paragraphs: [
          "Ko se trda voda segreva ali izhlapeva, se del raztopljenih mineralov izloči v trdne obloge. Zato vodni kamen najprej opazimo na grelnikih, kuhalnikih, prhah, armaturah in steklu tuš kabine. Bele sledi po sušenju so običajno bolj izrazite tam, kjer je voda trša.",
          "Količina oblog ni odvisna samo od trdote. Vplivajo tudi temperatura, poraba, pogostost sušenja kapljic in zasnova naprave. Dve gospodinjstvi z enako trdoto lahko zato opazita različno količino oblog.",
        ],
      },
      {
        title: "Kaj lahko opazite doma",
        paragraphs: [
          "Pogosti znaki so belkast rob okoli pipe, moten videz stekla, obloge na grelcu kuhalnika in hitrejše nalaganje usedlin na pršni glavi. Ti znaki kažejo, da je meritev smiselna, vendar iz njihovega videza ne morete zanesljivo določiti natančne trdote.",
          "Obloge lahko povečajo potrebo po čiščenju in vplivajo na vzdrževanje naprav, ki segrevajo vodo. Pred nakupom rešitve preverite tudi navodila proizvajalca bojlerja, pralnega ali pomivalnega stroja.",
        ],
      },
      {
        title: "Meritev pred izbiro izdelka",
        paragraphs: [
          "Za prvo orientacijo uporabite podatek lokalnega dobavitelja vode, testni listič ali kapljični test. Če se oskrba spreminja med različnimi vodnimi viri, je domača meritev uporabnejša od starega splošnega podatka za celotno občino.",
          "Rezultat zapišite skupaj z datumom, mestom odvzema in uporabljeno metodo. Za izbiro mehčalca ga povežite s številom oseb, mesečno porabo in največjim sočasnim pretokom v domu.",
        ],
      },
      {
        title: "Katera rešitev je smiselna",
        paragraphs: [
          "Ionski mehčalec zmanjšuje trdoto vode, medtem ko filtri za delce, dozirni sistemi in drugi izdelki rešujejo drugačne naloge. Najprej določite, ali želite obdelati vodo za celoten dom ali zaščititi samo posamezno napravo.",
          "Primerjajte dejanski način delovanja, pretok, dimenzije, priključke in zahteve za vzdrževanje. Dober nakup se začne z jasno težavo in meritvijo, ne samo z imenom tehnologije na embalaži.",
        ],
      },
    ],
  },
  {
    slug: "kako-izmeriti-trdoto-vode",
    title: "Kako izmeriti trdoto vode doma",
    excerpt: "Kaj zabeležiti pri testnem lističu, kapljičnem testu ali podatku lokalnega dobavitelja vode.",
    readingTime: "8 min branja",
    status: "published",
    updatedAt: "2026-09-22",
    comparison: {
      title: "Primerjava načinov merjenja",
      caption: "Izberite metodo glede na potrebno natančnost in namen rezultata.",
      columns: ["Metoda", "Prednost", "Omejitev", "Najprimernejša uporaba"],
      rows: [
        ["Podatek dobavitelja", "Brez nakupa testa", "Lahko je povprečen ali starejši", "Prva orientacija za oskrbovalno območje"],
        ["Testni listič", "Hiter in preprost", "Pogosto pokaže samo območje", "Groba domača preverba"],
        ["Kapljični test", "Bolj razločen rezultat", "Zahteva pravilen volumen in štetje", "Izbira in nastavitev mehčalca"],
        ["Laboratorijska analiza", "Širši nabor podatkov", "Višji strošek in daljši postopek", "Lasten vir ali več težav z vodo"],
      ],
    },
    sections: [
      {
        title: "Najprej preverite podatek dobavitelja",
        paragraphs: [
          "Lokalni dobavitelj vode pogosto objavi trdoto za posamezno oskrbovalno območje. Preverite, ali se podatek nanaša na vaš naslov, iz katerega obdobja je in v kateri enoti je zapisan. Povprečje za več virov je lahko manj uporabno od meritve na domači pipi.",
          "Če uporabljate lasten vodni vir, osnovni test trdote ne nadomesti širše analize kakovosti vode. Trdota pove nekaj o kalciju in magneziju, ne poda pa celotne slike o mikrobioloških ali drugih kemijskih lastnostih.",
        ],
      },
      {
        title: "Merjenje s testnim lističem",
        paragraphs: [
          "Listič za predpisani čas pomočite v svež vzorec in ga nato primerjajte z barvno lestvico v času, ki ga določa proizvajalec. Predolg stik z vodo ali prepozno odčitavanje lahko spremeni barvo in rezultat.",
          "Lističi so hitri in priročni, vendar pogosto pokažejo območje namesto ene natančne vrednosti. Za grobo razvrstitev vode je to lahko dovolj, za natančnejše dimenzioniranje pa je primernejši kapljični test ali laboratorijski podatek.",
        ],
      },
      {
        title: "Merjenje s kapljičnim testom",
        paragraphs: [
          "Pri kapljičnem testu odmerite količino vode, nato dodajate reagent po navodilih, dokler se barva ne spremeni. Število kapljic se pretvori v trdoto po pravilu, navedenem pri konkretnem kompletu. Ne uporabljajte pretvorbe iz drugega testa.",
          "Stekleničko držite navpično, da so kapljice podobne velikosti, in vzorec po vsaki kapljici nežno premešajte. Posodo pred meritvijo sperite z vodo, ki jo boste testirali.",
        ],
      },
      {
        title: "Kako dobiti primerljiv rezultat",
        paragraphs: [
          "Vzemite hladno vodo na mestu, ki predstavlja dovod v dom, in pustite, da nekaj časa teče. Ne merite takoj za obstoječim filtrom ali mehčalcem, če želite poznati vhodno trdoto. Za preverjanje delovanja naprave pa izmerite vzorec pred njo in za njo.",
          "Zapišite datum, uro, mesto odvzema, rezultat, enoto in metodo. Če dobite presenetljiv rezultat, meritev ponovite z novim vzorcem. Dve podobni meritvi sta boljša osnova za odločitev kot en sam nejasen odčitek.",
        ],
      },
      {
        title: "Kako rezultat uporabiti pri nakupu",
        paragraphs: [
          "Trdota je samo eden od vhodnih podatkov. Mehčalec mora ustrezati tudi porabi vode, največjemu pretoku, tlaku, velikosti priključka in prostoru, ki je na voljo. Pri zelo spremenljivi trdoti uporabite višjo zanesljivo izmerjeno vrednost in preverite priporočila proizvajalca.",
          "Rezultat vnesite v vodnik za izbiro Bistrava, nato primerjajte izdelke po kapaciteti in potrjenem delovnem pretoku. Meritev shranite, saj jo boste potrebovali tudi pri začetni nastavitvi naprave.",
        ],
      },
    ],
  },
  {
    slug: "kako-deluje-mehcalec-vode",
    title: "Kako deluje ionski mehčalec vode",
    excerpt: "Ionska izmenjava, regeneracija s slanico in omejitve, ki jih je treba poznati pred nakupom.",
    readingTime: "9 min branja",
    status: "published",
    updatedAt: "2026-09-22",
    comparison: {
      title: "Mehčalec in druge vrste obdelave",
      caption: "Tehnologije imajo različne naloge in se lahko med seboj dopolnjujejo.",
      columns: ["Rešitev", "Kaj obravnava", "Kaj potrebuje", "Česa ne nadomesti"],
      rows: [
        ["Ionski mehčalec", "Kalcijeve in magnezijeve ione", "Sol, odtok, prostor in nastavitev", "Filtracije delcev ali celotne analize vode"],
        ["Mehanski filter", "Delce nad določeno velikostjo", "Združljiv vložek in menjave", "Zmanjšanja raztopljene trdote"],
        ["Ciljna zaščita", "Določen aparat ali odsek", "Pravilen priključek in pretok", "Obdelave celotnega doma"],
        ["Analiza vode", "Poda podatke o vzorcu", "Pravilen odvzem in ustrezno metodo", "Naprave za obdelavo vode"],
      ],
    },
    sections: [
      {
        title: "Kaj se dogaja v posodi s smolo",
        paragraphs: [
          "Ionski mehčalec vsebuje smolo, skozi katero teče voda. Smola veže predvsem kalcijeve in magnezijeve ione, povezane s trdoto, ter jih izmenja z natrijevimi ioni. Na izhodu je zato trdota nižja, količina raztopljenih mineralnih snovi pa ni nujno manjša.",
          "To je bistvena razlika med mehčalcem in mehanskim filtrom. Filter zadrži delce določene velikosti, ionska izmenjava pa deluje na raztopljene ione. Ena tehnologija zato ne nadomesti samodejno druge.",
        ],
      },
      {
        title: "Zakaj je potrebna regeneracija",
        paragraphs: [
          "Smola lahko veže omejeno količino kalcija in magnezija. Ko se njena kapaciteta približa izčrpanju, naprava iz posode za sol pripravi slanico in z njo obnovi sposobnost smole za naslednji cikel.",
          "Sodobno krmiljenje lahko regeneracijo sproži glede na izmerjeno porabo, čas ali kombinacijo nastavitev. Volumetrično krmiljenje običajno bolje sledi dejanski uporabi kot regeneracija samo po fiksnem koledarju, vendar mora biti pravilno nastavljeno.",
        ],
      },
      {
        title: "Kapaciteta in pretok nista ista podatek",
        paragraphs: [
          "Kapaciteta pove, koliko trdote lahko naprava obdela med regeneracijama. Pretok pa pove, koliko vode lahko v določenem trenutku preide skozi napravo ob sprejemljivem padcu tlaka. Za udobno uporabo morata biti primerna oba podatka.",
          "Premajhen pretok se lahko pokaže kot slabši tlak med hkratnim tuširanjem in uporabo drugih porabnikov. Prevelika naprava pa ni samodejno boljša, saj lahko pomeni nepotrebno velikost, daljše mirovanje vode ali neprimerne cikle regeneracije.",
        ],
      },
      {
        title: "Kaj naprava potrebuje za delovanje",
        paragraphs: [
          "Običajna vgradnja zahteva primeren dovod, odtok za regeneracijsko vodo, prostor za varno polnjenje soli in pogosto električno napajanje. Obvod omogoča, da lahko napravo izločite iz sistema med vzdrževanjem.",
          "Pred izbiro preverite dovoljeni tlak, temperaturo vode, velikost priključka, mere naprave in navodila za odtok. Končne zahteve vedno določa dokumentacija konkretnega modela.",
        ],
      },
      {
        title: "Kaj pričakovati pri uporabi",
        paragraphs: [
          "Po pravilni nastavitvi spremljajte nivo soli, morebitna opozorila in spremembe porabe. Občasna regeneracija je normalen del delovanja. Čas regeneracije se pogosto nastavi na obdobje, ko je poraba vode najmanjša.",
          "Mehčalec zahteva redno vzdrževanje in ne rešuje vseh težav z vodo. Motnost, delci, vonj ali posebnosti lastnega vodnega vira potrebujejo ločeno oceno in ustrezno tehnologijo.",
        ],
      },
    ],
  },
  {
    slug: "mehcalec-vode-za-hiso-vodic",
    title: "Mehčalec vode za hišo: podatki pred nakupom",
    excerpt: "Kontrolni seznam za trdoto, porabo, kopalnice, pretok, prostor in priključke.",
    readingTime: "9 min branja",
    status: "published",
    updatedAt: "2026-09-22",
    comparison: {
      title: "Primerjava profilov uporabe v hiši",
      caption: "Profil pomaga zožiti izbor; končno velikost določijo meritev, poraba in tehnični list.",
      columns: ["Profil", "Značilna uporaba", "Ključni podatek", "Na kaj paziti"],
      rows: [
        ["Manjša poraba", "Manj oseb in ena kopalnica", "Kapaciteta pri izmerjeni trdoti", "Da pretok še vedno zadostuje"],
        ["Običajna družinska hiša", "Več vsakodnevnih porabnikov", "Poraba in sočasni pretok", "Razumno pogostost regeneracije"],
        ["Več kopalnic", "Sočasno tuširanje in drugi porabniki", "Potrjen delovni pretok", "Padec tlaka skozi napravo"],
        ["Spremenljiva zasedenost", "Apartma ali pogosti gostje", "Največja realna poraba", "Nastavitve za obdobja mirovanja"],
      ],
    },
    sections: [
      {
        title: "Začnite z meritvijo in porabo",
        paragraphs: [
          "Izmerite trdoto vhodne vode in poglejte račune za zadnjih nekaj mesecev. Mesečna poraba pokaže približno dnevno količino vode, trdota pa mineralno obremenitev, ki jo mora prevzeti smola.",
          "Če se število stanovalcev ali poraba med letom močno spreminja, zapišite običajno in največjo uporabo. Počitniška hiša, stalno naseljena hiša in objekt z več apartmaji potrebujejo različne premisleke.",
        ],
      },
      {
        title: "Ocenite največji sočasni pretok",
        paragraphs: [
          "Preštejte kopalnice in večje porabnike, ki lahko delujejo hkrati. Tuš, polnjenje kadi, pralni stroj in kuhinjska pipa ustvarijo kratkotrajno potrebo, ki je mesečni račun ne pokaže.",
          "V tehničnem listu primerjajte nazivni oziroma delovni pretok ter pogoje, pri katerih je izmerjen. Samo podatek o litrih smole še ne potrdi, da bo tlak pri sočasni uporabi ustrezen.",
        ],
      },
      {
        title: "Preverite prostor in priključke",
        paragraphs: [
          "Izmerite širino, globino in višino mesta vgradnje. Upoštevajte odpiranje pokrova, polnjenje soli, priklop cevi in dostop za vzdrževanje. Fotografija brez merila pogosto ni dovolj za presojo prostora.",
          "Preverite premer glavnega dovoda, tlak, bližino odtoka, električno vtičnico in možnost obvoda. Zunanji ali neogrevani prostor mora ustrezati dovoljenemu temperaturnemu območju naprave.",
        ],
      },
      {
        title: "Primerjajte stroške uporabe",
        paragraphs: [
          "Poleg nakupne cene primerjajte porabo soli in vode na regeneracijo, pogostost ciklov, garancijo ter dostopnost potrošnega materiala. Nizka cena naprave ne pove, koliko bo stala njena uporaba v več letih.",
          "Preverite tudi, kaj je vključeno v kompletu: obvod, priključni elementi, cev za odtok ali začetna količina soli niso vedno del osnovnega paketa.",
        ],
      },
      {
        title: "Kontrolni seznam pred nakupom",
        paragraphs: [
          "Pripravite trdoto v °dH, mesečno porabo, število oseb, kopalnic in večjih porabnikov. Nato zapišite tlak, premer cevi, mere prostora ter razpoložljiv odtok in napajanje.",
          "Izdelek izberite šele, ko se podatki ujemajo z njegovim tehničnim listom. Če ključni podatek manjka, primerjavo začasno omejite na modele, pri katerih ga proizvajalec jasno objavlja.",
        ],
      },
    ],
  },
  {
    slug: "mehcalec-vode-za-stanovanje-vodic",
    title: "Mehčalec vode za stanovanje: preverba izvedljivosti",
    excerpt: "Kako preveriti individualni dovod, prostor, odtok in pravila posega v večstanovanjski stavbi.",
    readingTime: "8 min branja",
    status: "published",
    updatedAt: "2026-09-22",
    comparison: {
      title: "Primerjava možnosti za stanovanje",
      caption: "Izvedljivost je odvisna od dovoda, prostora in območja, ki ga želite zaščititi.",
      columns: ["Možnost", "Prednost", "Glavni pogoj", "Omejitev"],
      rows: [
        ["Kompaktni centralni mehčalec", "Obravnava celoten dovod stanovanja", "Individualni dovod, odtok in napajanje", "Potrebuje servisni prostor"],
        ["Mehčalec za posamezen odsek", "Manjši poseg", "Dostopen dovod izbranega odseka", "Ne obravnava vseh porabnikov"],
        ["Ciljna zaščita aparata", "Usmerjena zaščita enega porabnika", "Združljiv priključek in tehnologija", "Ni enaka centralnemu mehčanju"],
        ["Brez naprave", "Brez posega in vzdrževanja", "Redno čiščenje in spremljanje", "Obloge ostanejo del uporabe"],
      ],
    },
    sections: [
      {
        title: "Poiščite pravi dovod",
        paragraphs: [
          "Najprej potrdite, katera cev oskrbuje samo vaše stanovanje. Dostopna cev ob števcu ni vedno primerna za poseg, skupni vodi pa lahko spadajo med skupne dele stavbe.",
          "Preverite pravila upravljanja stavbe in dostop do zapornega ventila. Izbrana točka mora omogočati varno izločitev naprave brez vpliva na oskrbo drugih stanovanj.",
        ],
      },
      {
        title: "Kompaktna naprava še vedno potrebuje prostor",
        paragraphs: [
          "Izmerite celotno nišo in ne samo tlorisa naprave. Potrebujete prostor za priključne cevi, odpiranje pokrova, dodajanje soli ter dostop do krmilnika in obvoda.",
          "Pri omarici preverite tudi prezračevanje, zaščito pred morebitnim iztekanjem in nosilnost tal. Naprava je zaradi vode, smole in soli težja, kot kaže prazna masa v katalogu.",
        ],
      },
      {
        title: "Odtok in električno napajanje",
        paragraphs: [
          "Ionski mehčalec med regeneracijo odvaja vodo, zato potrebuje ustrezno izveden odtok po navodilih proizvajalca. Dolga, dvignjena ali nepravilno pritrjena odtočna cev lahko povzroči težave pri delovanju.",
          "Večina kompaktnih modelov potrebuje tudi električno napajanje. Podaljški v mokrem okolju niso dobra trajna rešitev; preverite položaj primerne vtičnice in dolžino priloženega kabla.",
        ],
      },
      {
        title: "Izbira zmogljivosti za stanovanje",
        paragraphs: [
          "Manjše gospodinjstvo pogosto potrebuje manjšo kapaciteto, vendar mora naprava še vedno prenesti trenutni pretok pri tuširanju in uporabi kuhinje. Število oseb je izhodišče, ne edino merilo.",
          "Primerjajte trdoto, porabo, delovni pretok, mere in hrup oziroma čas regeneracije. Pri postavitvi blizu spalnega prostora je časovni program regeneracije posebej uporaben.",
        ],
      },
      {
        title: "Če centralna vgradnja ni mogoča",
        paragraphs: [
          "Zaščita posameznega grelnika ali aparata je lahko izvedljiva tam, kjer ni dostopa do glavnega dovoda. Takšna rešitev deluje samo na izbranem odseku in ne zagotavlja nujno enakega učinka kot mehčanje vse vode v stanovanju.",
          "Pred nakupom jasno določite, kateri porabnik želite zaščititi, kakšen je priključek in kakšen učinek izdelek dejansko navaja. Tako ne boste primerjali izdelkov, ki rešujejo različne naloge.",
        ],
      },
    ],
  },
  {
    slug: "kako-dimenzionirati-mehcalec-vode",
    title: "Kako dimenzionirati mehčalec vode",
    excerpt: "Zakaj trdota, poraba, pretok in kapaciteta smole sodijo v isti izračun.",
    readingTime: "10 min branja",
    status: "published",
    updatedAt: "2026-09-22",
    comparison: {
      title: "Kaj pove posamezen podatek",
      caption: "Dimenzioniranje je zanesljivo šele, ko se podatki obravnavajo skupaj.",
      columns: ["Podatek", "Kaj določa", "Če je ocenjen prenizko", "Če ga prezrete"],
      rows: [
        ["Trdota vode", "Mineralno obremenitev smole", "Prehiter preboj trdote", "Napačne nastavitve regeneracije"],
        ["Dnevna poraba", "Obdelano količino med cikli", "Prepogoste regeneracije", "Neprimerna kapaciteta"],
        ["Sočasni pretok", "Udobje pri več odprtih porabnikih", "Padec tlaka", "Slaba uporabniška izkušnja"],
        ["Kapaciteta naprave", "Količino dela med regeneracijama", "Premalo rezerve", "Nakup brez primerljive osnove"],
      ],
    },
    sections: [
      {
        title: "Štirje podatki za začetek",
        paragraphs: [
          "Za smiselno dimenzioniranje potrebujete trdoto vhodne vode, dnevno ali mesečno porabo, največji sočasni pretok in tehnično kapaciteto konkretne naprave. Vsak podatek odgovarja na drugo vprašanje.",
          "Trdota in poraba določata, kako hitro se izrablja kapaciteta smole. Sočasni pretok določa, ali lahko naprava oskrbi odprte pipe brez motečega padca tlaka.",
        ],
      },
      {
        title: "Od mesečne porabe do dnevne obremenitve",
        paragraphs: [
          "Mesečno porabo z računa delite s številom dni v obračunskem obdobju. Tako dobite boljšo osnovo kot splošna ocena na osebo. Upoštevajte sezonske spremembe in občasno večje število uporabnikov.",
          "Za primerjavo naprav uporabite isto obdobje in isto enoto. Če proizvajalec kapaciteto navaja v drugi obliki, potrebujete njegov postopek pretvorbe; neposredno primerjanje različnih enot lahko zavede.",
        ],
      },
      {
        title: "Kapaciteta med regeneracijama",
        paragraphs: [
          "Primerna naprava naj obdela smiselno količino vode med regeneracijama, ne da bi smola redno dosegala popolno izčrpanost. Krmiljenje potrebuje pravilno vneseno trdoto in po potrebi varnostno rezervo.",
          "Prevelika rezerva poveča pogostost regeneracij in porabo, premajhna pa lahko povzroči preboj trdote pred naslednjim ciklom. Uporabite nastavitve, ki jih dovoljuje proizvajalec konkretnega modela.",
        ],
      },
      {
        title: "Preverite delovni pretok",
        paragraphs: [
          "Seštejte verjetne sočasne porabnike, na primer dve prhi in kuhinjsko pipo. Rezultat primerjajte z nazivnim ali priporočenim delovnim pretokom, ne samo z največjo kratkotrajno vrednostjo.",
          "Upoštevajte tudi padec tlaka skozi napravo in obstoječe stanje napeljave. Visok oglaševani pretok brez navedenih merilnih pogojev ni dovolj zanesljiv za odločitev.",
        ],
      },
      {
        title: "Pogoste napake pri izbiri",
        paragraphs: [
          "Najpogostejše bližnjice so izbira samo po številu oseb, nakup največje naprave ali primerjava zgolj po litrih smole. Nobena od teh metod ne preveri hkrati kapacitete, pretoka in prostorskih pogojev.",
          "Pred nakupom preverite še tlak, premer priključka, odtok, napajanje, obvod, mere in porabo soli. Če so podatki na produktni strani nepopolni, poiščite tehnični list proizvajalca.",
        ],
      },
    ],
  },
  {
    slug: "montaza-mehcalca-vode-kontrolni-seznam",
    title: "Namestitev mehčalca vode: kontrolni seznam",
    excerpt: "Kaj preveriti na dovodu, odtoku in napajanju ter kako varno pripraviti prvi zagon naprave.",
    readingTime: "9 min branja",
    status: "published",
    updatedAt: "2026-09-22",
    comparison: {
      title: "Kontrolna tabela namestitve",
      caption: "Vsako točko preverite glede na navodila izbranega modela in dejansko napeljavo.",
      columns: ["Področje", "Preverite pred delom", "Preverite po zagonu", "Pogosta napaka"],
      rows: [
        ["Dovod", "Tlak, premer in smer pretoka", "Tesnost in tlak na pipah", "Zamenjan vhod in izhod"],
        ["Odtok", "Pot, višino in način priklopa", "Prost pretok med regeneracijo", "Pregib ali nepravilna višina cevi"],
        ["Obvod", "Dostopnost vseh ventilov", "Pravilne delovne položaje", "Nejasna postavitev ventilov"],
        ["Napajanje", "Varno in dostopno vtičnico", "Čas ter ohranjene nastavitve", "Trajna uporaba neprimernega podaljška"],
        ["Nastavitve", "Trdoto in navodila modela", "Trdoto na izhodu", "Privzete vrednosti brez meritve"],
      ],
    },
    sections: [
      {
        title: "Izberite primerno mesto",
        paragraphs: [
          "Naprava naj bo na suhem, stabilnem in pred zmrzaljo zaščitenem mestu blizu glavnega dovoda. Okoli nje pustite prostor za priključke, odpiranje pokrova, dodajanje soli in redno vzdrževanje.",
          "Preverite mere napolnjene naprave in predvidite možnost nadzora morebitnega iztekanja. Tla morajo prenesti maso naprave, vode in zaloge soli.",
        ],
      },
      {
        title: "Dovod, tlak in smer pretoka",
        paragraphs: [
          "Pred delom zaprite dovod in sprostite tlak v napeljavi. Preverite dovoljeni delovni tlak, velikost priključkov in puščico smeri pretoka na napravi. Vhod in izhod ne smeta biti zamenjana.",
          "Pred mehčalcem je lahko smiseln ustrezen mehanski predfilter, če to dovoljuje zasnova sistema. Njegova velikost mora ohraniti potreben pretok in ne sme povzročiti čezmernega padca tlaka.",
        ],
      },
      {
        title: "Obvod, odtok in preliv",
        paragraphs: [
          "Obvod omogoča oskrbo z vodo, ko je naprava izločena zaradi vzdrževanja. Ventili morajo biti dostopni in jasno postavljeni v položaj, ki ga uporabnik razume.",
          "Odtočno in prelivno cev izvedite po navodilih proizvajalca, brez pregibov in z zahtevanim zračnim razmikom, kjer je predpisan. Preliv ni nadomestilo za pravilno priključen regeneracijski odtok.",
        ],
      },
      {
        title: "Napajanje in prvi zagon",
        paragraphs: [
          "Uporabite ustrezno in dostopno električno vtičnico. Krmilnik nastavite z dejansko trdoto, časom in drugimi podatki, ki jih zahteva priročnik. Splošne nastavitve z interneta niso nujno pravilne za vaš model.",
          "Pred odpiranjem polnega pretoka počasi napolnite sistem, izpustite zrak in preverite vse spoje. Izvedite postopek prvega zagona ter regeneracije samo v zaporedju, ki ga določa proizvajalec.",
        ],
      },
      {
        title: "Preverjanje po namestitvi",
        paragraphs: [
          "Preverite tesnost, tlak na porabnikih, delovanje obvoda in prost pretok v odtok. Nato izmerite trdoto vhodne ter obdelane vode in rezultat zapišite skupaj z začetnimi nastavitvami.",
          "Shranite navodila, račun, serijsko številko in datum zagona. Posege v vodovodno napeljavo naj izvede usposobljena oseba v skladu z navodili naprave in lokalnimi zahtevami.",
        ],
      },
    ],
  },
  {
    slug: "vzdrzevanje-mehcalne-naprave",
    title: "Vzdrževanje mehčalne naprave",
    excerpt: "Kaj spremljati med redno uporabo in kako pravočasno prepoznati odstopanja v delovanju.",
    readingTime: "8 min branja",
    status: "published",
    updatedAt: "2026-09-22",
    comparison: {
      title: "Pregled opravil vzdrževanja",
      caption: "Pogostost prilagodite navodilom modela, porabi in kakovosti vhodne vode.",
      columns: ["Opravilo", "Kaj opazujete", "Kdaj ukrepati", "Koristen zapis"],
      rows: [
        ["Nivo soli", "Količino in morebitno strjevanje", "Preden je posoda predolgo prazna", "Datum in dodana količina"],
        ["Izhodna trdota", "Primerljiv rezultat testa", "Ob odstopanju od začetne meritve", "Rezultat, enota in metoda"],
        ["Regeneracije", "Pogostost in morebitne kode", "Ob nenadni spremembi", "Datum in prikazana napaka"],
        ["Tesnost", "Spoje, cevi in okolico naprave", "Takoj ob vlagi ali kapljanju", "Fotografija in mesto iztekanja"],
        ["Servis", "Postopke iz navodil", "Po intervalu proizvajalca", "Datum in izvedena dela"],
      ],
    },
    sections: [
      {
        title: "Navodila modela imajo prednost",
        paragraphs: [
          "Intervali čiščenja, dovoljena sol in servisni postopki se razlikujejo med modeli. Osnovni načrt zato vedno začnite z uradnimi navodili in garancijskimi pogoji svoje naprave.",
          "Zapišite znamko, model in serijsko številko. Tako boste pri nakupu potrošnega materiala ali iskanju dokumentacije preverjali pravo različico.",
        ],
      },
      {
        title: "Redno preverjajte sol",
        paragraphs: [
          "Nivo soli preverjajte v preglednih časovnih presledkih in jo dodajte, preden je posoda predolgo prazna. Uporabite vrsto soli, ki jo dovoljuje proizvajalec, ter pazite, da v posodo ne pridejo umazanija ali tujki.",
          "Če je sol videti polna, vendar se nivo dalj časa ne znižuje, preverite možnost strjene plasti oziroma solnega mostu po postopku iz navodil. Ne udarjajte po posodi z ostrim ali težkim predmetom.",
        ],
      },
      {
        title: "Spremljajte delovanje in porabo",
        paragraphs: [
          "Občasno zapišite stanje števca, datume polnjenja soli in morebitne kode na zaslonu. Nenadna sprememba porabe soli ali pogostosti regeneracije je razlog za preverjanje nastavitev in napeljave.",
          "Trdoto za napravo izmerite po enaki metodi kot ob zagonu. Primerljiv zapis lažje pokaže spremembo kot ocena na podlagi občutka pri umivanju.",
        ],
      },
      {
        title: "Čistoča in daljše mirovanje",
        paragraphs: [
          "Zunanjost, pokrov in območje okoli soli ohranjajte čiste. Za čiščenje ali razkuževanje notranjih delov uporabljajte samo postopke in sredstva, dovoljena za konkretni model.",
          "Pred daljšim mirovanjem preverite priporočila proizvajalca. Po vrnitvi ne spreminjajte nastavitev na pamet, temveč sledite postopku ponovnega zagona.",
        ],
      },
      {
        title: "Znaki, ki zahtevajo pregled",
        paragraphs: [
          "Stalno odtekanje vode, puščanje, nenavaden hrup, ponavljajoča se napaka ali občutna sprememba tlaka zahtevajo hiter pregled. Ob iztekanju uporabite obvod oziroma zaprite ustrezen ventil, če to lahko storite varno.",
          "Za diagnostiko pripravite fotografijo zaslona, opis težave, datum zadnje regeneracije, nivo soli in zadnjo meritev trdote. Ne razstavljajte tlačnih delov brez ustreznega znanja.",
        ],
      },
    ],
  },
  {
    slug: "sol-za-mehcalec-vode-vodic",
    title: "Sol za mehčalec vode: izbira in uporaba",
    excerpt: "Zakaj se sol uporablja, kaj preveriti na embalaži in kako spremljati porabo.",
    readingTime: "7 min branja",
    status: "published",
    updatedAt: "2026-09-22",
    comparison: {
      title: "Kako primerjati sol za mehčalec",
      caption: "Združljivost z navodili naprave je pomembnejša od same velikosti pakiranja.",
      columns: ["Merilo", "Kaj iskati", "Zakaj je pomembno", "Opozorilni znak"],
      rows: [
        ["Namen", "Jasno navedeno uporabo v mehčalcih", "Potrjuje primerno področje uporabe", "Splošna sol brez navedenega namena"],
        ["Oblika", "Obliko, dovoljeno v navodilih", "Vpliva na raztapljanje in ravnanje", "Naključna mešanica različnih oblik"],
        ["Čistost", "Čisto in enakomerno vsebino", "Zmanjšuje nečistoče v posodi", "Vidna umazanija ali močno drobljenje"],
        ["Embalaža", "Suho in nepoškodovano vrečo", "Sol hitro veže vlago", "Raztrgana ali mokra embalaža"],
        ["Cena", "Primerjavo cene na kilogram", "Omogoča primerjavo pakiranj", "Odločitev samo po skupni ceni vreče"],
      ],
    },
    sections: [
      {
        title: "Vloga soli pri regeneraciji",
        paragraphs: [
          "Sol se v ionskem mehčalcu uporablja za pripravo slanice, ki med regeneracijo obnovi sposobnost smole. Ne dodaja se v pitno vodo kot običajna sestavina, temveč sodeluje v ločenem regeneracijskem ciklu.",
          "Brez primerne količine soli naprava po izrabi kapacitete ne more pravilno obnoviti smole. Posledica je lahko postopno vračanje trdote na izhodu.",
        ],
      },
      {
        title: "Tablete, peleti ali druga oblika",
        paragraphs: [
          "Uporabite obliko in kakovost, ki jo dovoljuje proizvajalec naprave. Tabletirana sol je pogosta zaradi enakomerne oblike in priročnega polnjenja, vendar oznaka na embalaži še vedno mora ustrezati zahtevam modela.",
          "Ne mešajte naključno različnih izdelkov in ne uporabljajte soli z dodatki, ki niso namenjeni mehčalnim napravam. Nečistoče lahko povečajo količino usedlin v posodi za slanico.",
        ],
      },
      {
        title: "Kaj preveriti na embalaži",
        paragraphs: [
          "Preberite namen uporabe, sestavo, maso pakiranja, pogoje shranjevanja in morebitne navedene standarde. Embalaža mora biti nepoškodovana, vsebina pa suha in brez vidne umazanije.",
          "Pri primerjavi cene upoštevajte ceno na kilogram in težo, ki jo lahko varno prenašate. Večje pakiranje ni prednost, če ga ne morete hraniti na suhem.",
        ],
      },
      {
        title: "Pravilno polnjenje in shranjevanje",
        paragraphs: [
          "Pred polnjenjem preverite nivo in stanje soli. Ne prekrijte delov, ki morajo po navodilih ostati vidni, in ne nasujte več od dovoljene količine. Pokrov po polnjenju dobro zaprite.",
          "Rezervna pakiranja hranite dvignjena od tal, v suhem prostoru in zaščitena pred poškodbami. Sol hitro veže vlago, zato odprte vreče dobro zaprite.",
        ],
      },
      {
        title: "Kako razumeti porabo soli",
        paragraphs: [
          "Poraba je odvisna od trdote, količine vode, kapacitete smole, nastavitev in učinkovitosti regeneracije. Smiselno jo primerjate šele, ko poznate iste vhodne pogoje.",
          "Vodite preprost zapis datumov in dodanih količin. Če se poraba brez spremembe navad izrazito poveča ali zmanjša, preverite nastavitve, morebitno puščanje in pravilno tvorbo slanice.",
        ],
      },
    ],
  },
  {
    slug: "mehcalec-ali-zascita-proti-kamnu",
    title: "Mehčalec ali druga zaščita proti vodnemu kamnu",
    excerpt: "Kako ločiti odstranjevanje trdote od rešitev, ki mineralov iz vode ne odstranijo.",
    readingTime: "9 min branja",
    status: "published",
    updatedAt: "2026-09-22",
    comparison: {
      title: "Primerjava pristopov proti vodnemu kamnu",
      caption: "Izbira je odvisna od želenega učinka, območja zaščite in možnosti vzdrževanja.",
      columns: ["Pristop", "Zmanjša izmerjeno trdoto", "Območje delovanja", "Redna obveznost"],
      rows: [
        ["Ionski mehčalec", "Da", "Celoten priključeni razvod", "Sol, spremljanje in servis po navodilih"],
        ["Mehanski filter", "Ne", "Mesto za filtrom", "Čiščenje ali menjava vložka"],
        ["Ciljna zaščita", "Odvisno od tehnologije", "Posamezen aparat ali odsek", "Postopek, ki ga določa izdelek"],
        ["Čiščenje oblog", "Ne", "Samo očiščena površina", "Ponavljanje glede na nastajanje oblog"],
      ],
    },
    sections: [
      {
        title: "Najprej določite želeni učinek",
        paragraphs: [
          "Vprašajte se, ali želite izmerljivo zmanjšati trdoto, zadržati mehanske delce ali zaščititi samo določen grelnik oziroma aparat. Izdelki z različnimi cilji niso neposredni nadomestki.",
          "Pred primerjavo zapišite začetno trdoto in mesto uporabe. Tako lahko preverite, ali proizvajalec opisuje učinek, ki ustreza vaši težavi.",
        ],
      },
      {
        title: "Ionski mehčalec",
        paragraphs: [
          "Ionski mehčalec zmanjšuje koncentracijo kalcijevih in magnezijevih ionov z ionsko izmenjavo. Učinek lahko preverite z meritvijo trdote pred napravo in za njo.",
          "Za delovanje potrebuje regeneracijsko sol, odtok, prostor in pravilne nastavitve. Primeren je, ko želite obdelati večji del ali celoten vodovodni razvod in so pogoji za vgradnjo izpolnjeni.",
        ],
      },
      {
        title: "Filtri in ciljna zaščita",
        paragraphs: [
          "Mehanski filter zadržuje delce glede na svojo filtracijsko stopnjo, ne odstranjuje pa samodejno raztopljene trdote. Vložek je treba menjati ali čistiti po navodilih in glede na dejansko obremenitev.",
          "Ciljna rešitev pred posamezno napravo lahko zmanjša določeno tveganje na tem mestu, vendar ne vpliva na preostali dom. Vedno preverite opisan način delovanja in omejitve izdelka.",
        ],
      },
      {
        title: "Kako presojati druge tehnologije",
        paragraphs: [
          "Pri napravah, ki mineralov ne odstranjujejo, ne pričakujte enakega rezultata na testu trdote kot pri ionski izmenjavi. Zahtevajte jasno razlago merljivega učinka, pogojev uporabe in potrebnega vzdrževanja.",
          "Posebej previdno presojajte splošne obljube brez tehničnega lista, navedenega pretoka ali omejitev. Fotografije čiste cevi same po sebi niso dovolj za primerjavo izdelkov.",
        ],
      },
      {
        title: "Odločitev po korakih",
        paragraphs: [
          "Izmerite trdoto, določite območje zaščite in preverite pretok, priključke ter prostor. Nato ločeno primerjajte začetno ceno, potrošni material, vzdrževanje in pričakovano življenjsko dobo.",
          "Izberite rešitev, katere učinek se ujema z vašim ciljem in ga lahko preverite. Če želite nižjo trdoto v celotnem domu, primerjajte mehčalce; če rešujete delce ali en porabnik, preglejte ustrezno namensko kategorijo.",
        ],
      },
    ],
  },
];

export const featuredGuides = guides.slice(0, 3);

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
