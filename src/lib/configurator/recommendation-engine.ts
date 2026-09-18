export type DwellingType = "house" | "apartment";
export type InstallationNeed = "yes" | "no" | "unsure";

export type ConfiguratorInput = {
  municipality: string;
  postalCode: string;
  hardnessDgh: number | null;
  dwellingType: DwellingType;
  residents: number;
  monthlyUsageM3: number | null;
  bathrooms: number;
  waterHeater: "electric" | "heat_pump" | "district" | "other" | "unknown";
  availableSpace: "compact" | "standard" | "unknown";
  connectionSize: string | null;
  installationNeed: InstallationNeed;
};

export type RecommendationProfile = {
  id: "compact" | "standard" | "high-flow";
  nameSl: string;
  whySl: string;
  estimatedCapacitySl: string;
  installationSl: string;
  maintenanceSl: string;
};

export type RecommendationResult = {
  needsAdvice: boolean;
  reasonSl: string;
  recommendations: RecommendationProfile[];
};

const profiles: Record<RecommendationProfile["id"], RecommendationProfile> = {
  compact: {
    id: "compact",
    nameSl: "Kompaktni profil ionskega mehčalca",
    whySl:
      "Primeren profil za manjše gospodinjstvo, če meritve prostora, pretoka in priključka potrdijo izvedljivost.",
    estimatedCapacitySl:
      "Nižji razred gospodinjske porabe; natančna kapaciteta in volumen smole se potrdita ob izbiri preverjenega modela.",
    installationSl:
      "Potreben je dostop do dovoda, primeren odtok, običajno napajanje ter dovolj prostora za polnjenje in servis.",
    maintenanceSl:
      "Redno polnjenje dovoljene soli, nadzor delovanja in pregledi po navodilih izbranega proizvajalca.",
  },
  standard: {
    id: "standard",
    nameSl: "Standardni hišni profil ionskega mehčalca",
    whySl:
      "Primeren izhodiščni profil za običajno družinsko porabo, ko so trdota, pretok in montažni pogoji potrjeni.",
    estimatedCapacitySl:
      "Srednji razred gospodinjske porabe; končna kapaciteta se izračuna iz dejanske porabe, trdote in podatkov modela.",
    installationSl:
      "Pred ponudbo je treba potrditi tlak, premer cevi, največji sočasni pretok, odtok, napajanje in obvod.",
    maintenanceSl:
      "Načrt vključuje dovoljeno sol, kontrolo nastavitev in servisne postopke konkretne naprave.",
  },
  "high-flow": {
    id: "high-flow",
    nameSl: "Profil za večjo porabo ali višji sočasni pretok",
    whySl:
      "Smiseln je pri večjem gospodinjstvu, več kopalnicah ali znani višji porabi, vendar zahteva natančen izračun pretoka.",
    estimatedCapacitySl:
      "Višji razred porabe; brez meritve največjega pretoka in potrjene kapacitete modela številčne vrednosti ne navajamo.",
    installationSl:
      "Potreben je tehnični pregled priključka, tlaka, prostora, odtoka, napajanja in vseh večjih porabnikov.",
    maintenanceSl:
      "Porabo soli in intervale pregleda se določi iz nastavitev, dejanske porabe in uradnega servisnega načrta.",
  },
};

export function recommendSolutions(input: ConfiguratorInput): RecommendationResult {
  if (!input.hardnessDgh || input.hardnessDgh <= 0) {
    return {
      needsAdvice: true,
      reasonSl:
        "Brez izmerjene trdote ne izbiramo mehčalca. Najprej opravite test ali pošljite podatke za svetovanje.",
      recommendations: [],
    };
  }

  if (input.residents < 1 || input.bathrooms < 1) {
    return {
      needsAdvice: true,
      reasonSl:
        "Za uporaben predlog potrebujemo število oseb in kopalnic.",
      recommendations: [],
    };
  }

  if (input.hardnessDgh < 8) {
    return {
      needsAdvice: true,
      reasonSl:
        "Vnesena trdota je razmeroma nizka. Pred izbiro centralnega mehčalca preverite cilj, ponovite meritev in ocenite, ali je poseg sorazmeren.",
      recommendations: [],
    };
  }

  const highDemand =
    input.residents >= 6 ||
    input.bathrooms >= 3 ||
    (input.monthlyUsageM3 !== null && input.monthlyUsageM3 >= 24);
  const compactDemand =
    input.residents <= 3 &&
    input.bathrooms === 1 &&
    (input.monthlyUsageM3 === null || input.monthlyUsageM3 < 15);

  if (highDemand) {
    return {
      needsAdvice: false,
      reasonSl:
        "Podatki kažejo na večjo porabo ali višji sočasni pretok. Pred izbiro modela je potreben tehnični izračun.",
      recommendations: [profiles["high-flow"], profiles.standard],
    };
  }

  if (compactDemand) {
    return {
      needsAdvice: false,
      reasonSl:
        input.dwellingType === "apartment"
          ? "Za manjše stanovanje je najprej smiseln pregled kompaktnega profila in izvedljivosti priklopa."
          : "Za manjše gospodinjstvo je smiseln kompaktni profil, če potrjeni pretok zadostuje.",
      recommendations: [profiles.compact, profiles.standard],
    };
  }

  return {
    needsAdvice: false,
    reasonSl:
      "Vneseni podatki ustrezajo standardnemu gospodinjskemu profilu. Končni model se potrdi po preverbi pretoka in montaže.",
    recommendations: [profiles.standard, profiles.compact],
  };
}
