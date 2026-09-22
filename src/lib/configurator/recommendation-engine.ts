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

export type ConfiguratorProduct = {
  sku: string;
  slug: string;
  nameSl: string;
  brand: string;
  shortDescriptionSl: string;
  unitPriceCents: number;
  imageUrl: string | null;
  imageAltSl: string;
  stockQuantity: number;
  householdSizeMin: number | null;
  householdSizeMax: number | null;
  resinVolumeLiters: number | null;
  maxFlowLitersPerMinute: number | null;
  connectionSize: string | null;
  dimensions: string | null;
  installationRequired: boolean;
};

export type ProductRecommendation = {
  product: ConfiguratorProduct;
  matchLabelSl: string;
  reasonsSl: string[];
  cautionsSl: string[];
  score: number;
};

export type RecommendationResult = {
  needsAdvice: boolean;
  reasonSl: string;
  assumptions: {
    estimatedMonthlyUsageM3: number;
    targetFlowLitersPerMinute: number;
    targetResinVolumeLiters: number;
  } | null;
  recommendations: ProductRecommendation[];
};

type ScoredProduct = ProductRecommendation & { disqualified: boolean };

function targetResinVolume(input: ConfiguratorInput) {
  let target = input.residents <= 3 ? 12 : input.residents <= 5 ? 20 : 30;
  if (input.hardnessDgh !== null && input.hardnessDgh >= 25) target += 4;
  if (input.monthlyUsageM3 !== null && input.monthlyUsageM3 >= 25) target += 4;
  return target;
}

function targetFlow(input: ConfiguratorInput) {
  return Math.max(18, 12 + input.bathrooms * 8 + Math.max(0, input.residents - 4) * 2);
}

function normalizedConnection(value: string | null) {
  return value?.toLowerCase().replaceAll(" ", "").replaceAll("″", "\"") ?? "";
}

function bathroomLabel(count: number) {
  if (count === 1) return "1 kopalnico";
  if (count === 2) return "2 kopalnici";
  if (count === 3 || count === 4) return `${count} kopalnice`;
  return `${count} kopalnic`;
}

function scoreProduct(
  input: ConfiguratorInput,
  product: ConfiguratorProduct,
  requiredFlow: number,
  requiredResin: number,
): ScoredProduct {
  let score = 60;
  let disqualified = false;
  const reasonsSl: string[] = [];
  const cautionsSl: string[] = [];

  if (product.householdSizeMin !== null && product.householdSizeMax !== null) {
    if (input.residents >= product.householdSizeMin && input.residents <= product.householdSizeMax) {
      score += 28;
      reasonsSl.push(`Proizvajalčev razpon ${product.householdSizeMin}–${product.householdSizeMax} oseb zajema vaše gospodinjstvo.`);
    } else if (input.residents > product.householdSizeMax) {
      score -= 18 + (input.residents - product.householdSizeMax) * 8;
      disqualified = input.residents > product.householdSizeMax + 1;
      cautionsSl.push(`Nazivni razpon se konča pri ${product.householdSizeMax} osebah; zmogljivost je treba posebej potrditi.`);
    } else {
      score -= 5;
      cautionsSl.push("Naprava je dimenzionirana za večje gospodinjstvo, zato preverite smotrnost izbire.");
    }
  }

  if (product.maxFlowLitersPerMinute !== null) {
    if (product.maxFlowLitersPerMinute >= requiredFlow) {
      score += Math.min(22, 14 + (product.maxFlowLitersPerMinute - requiredFlow) / 3);
      reasonsSl.push(`Pretok do ${product.maxFlowLitersPerMinute.toLocaleString("sl-SI")} l/min dosega ocenjeno potrebo ${requiredFlow} l/min.`);
    } else {
      const deficit = requiredFlow - product.maxFlowLitersPerMinute;
      score -= 18 + deficit * 2;
      disqualified ||= product.maxFlowLitersPerMinute < requiredFlow * 0.7;
      cautionsSl.push(`Pretok ${product.maxFlowLitersPerMinute.toLocaleString("sl-SI")} l/min je pod ocenjeno potrebo ${requiredFlow} l/min.`);
    }
  } else {
    cautionsSl.push("Največji pretok ni objavljen in ga je treba potrditi pred naročilom.");
  }

  if (product.resinVolumeLiters !== null) {
    const resinDifference = Math.abs(product.resinVolumeLiters - requiredResin);
    score += Math.max(0, 20 - resinDifference * 1.5);
    if (product.resinVolumeLiters >= requiredResin * 0.75) {
      reasonsSl.push(`${product.resinVolumeLiters} l ionske smole je blizu ocenjenemu razredu ${requiredResin} l.`);
    } else {
      score -= 12;
      cautionsSl.push(`Volumen smole ${product.resinVolumeLiters} l je manjši od ocenjenega razreda ${requiredResin} l.`);
    }
  }

  const compactProduct =
    (product.resinVolumeLiters !== null && product.resinVolumeLiters <= 15) ||
    /compact|mini|12\s*l/i.test(product.nameSl);
  if (input.availableSpace === "compact") {
    if (compactProduct) {
      score += 16;
      reasonsSl.push("Kompaktna izvedba ustreza označeni prostorski omejitvi.");
    } else {
      score -= 14;
      cautionsSl.push("Pred izbiro preverite, ali mere naprave ustrezajo omejenemu prostoru.");
    }
  } else if (input.dwellingType === "apartment" && compactProduct) {
    score += 8;
    reasonsSl.push("Kompaktna zasnova je primerna za običajno omejen prostor v stanovanju.");
  }

  const requestedConnection = normalizedConnection(input.connectionSize);
  const productConnection = normalizedConnection(product.connectionSize);
  if (requestedConnection && productConnection) {
    if (productConnection.includes(requestedConnection) || requestedConnection.includes(productConnection)) {
      score += 10;
      reasonsSl.push(`Priključek ${product.connectionSize} se ujema z vnesenim podatkom.`);
    } else {
      score -= 8;
      cautionsSl.push(`Priključek naprave ${product.connectionSize} primerjajte z vnesenim priključkom ${input.connectionSize}.`);
    }
  }

  if (input.hardnessDgh !== null && input.hardnessDgh >= 25 && product.resinVolumeLiters !== null && product.resinVolumeLiters >= 20) {
    score += 7;
    reasonsSl.push("Večji volumen smole je primernejši za zelo trdo vodo.");
  }

  if (input.availableSpace === "unknown") {
    cautionsSl.push(product.dimensions
      ? `Pred naročilom preverite razpoložljiv prostor glede na mere ${product.dimensions}.`
      : "Pred naročilom izmerite prostor in servisni dostop.");
  }
  if (input.installationNeed === "no" && product.installationRequired) {
    cautionsSl.push("Za ta izdelek je priporočena strokovna montaža.");
  }

  if (reasonsSl.length === 0) {
    reasonsSl.push("Izdelek je med najbližjimi razpoložljivimi modeli glede na vnesene podatke.");
  }

  return {
    product,
    score: Math.round(score),
    disqualified,
    matchLabelSl: "Možna alternativa",
    reasonsSl: reasonsSl.slice(0, 3),
    cautionsSl: cautionsSl.slice(0, 2),
  };
}

export function recommendProducts(
  input: ConfiguratorInput,
  products: ConfiguratorProduct[],
): RecommendationResult {
  if (!input.hardnessDgh || input.hardnessDgh <= 0) {
    return {
      needsAdvice: true,
      reasonSl: "Za izbiro konkretnega izdelka najprej potrebujemo izmerjeno trdoto vode.",
      assumptions: null,
      recommendations: [],
    };
  }

  if (input.residents < 1 || input.bathrooms < 1) {
    return {
      needsAdvice: true,
      reasonSl: "Za uporaben predlog potrebujemo veljavno število oseb in kopalnic.",
      assumptions: null,
      recommendations: [],
    };
  }

  if (input.hardnessDgh < 8) {
    return {
      needsAdvice: true,
      reasonSl: "Vnesena trdota je razmeroma nizka. Pred nakupom centralnega mehčalca ponovite meritev in preverite, ali je poseg smiseln.",
      assumptions: null,
      recommendations: [],
    };
  }

  const estimatedMonthlyUsageM3 = input.monthlyUsageM3 ?? Math.round(input.residents * 4.5);
  const targetFlowLitersPerMinute = targetFlow(input);
  const targetResinVolumeLiters = targetResinVolume(input);
  const ranked = products
    .map((product) => scoreProduct(input, product, targetFlowLitersPerMinute, targetResinVolumeLiters))
    .sort((left, right) => right.score - left.score);
  const qualified = ranked.filter((recommendation) => !recommendation.disqualified);
  const recommendations = (qualified.length >= 3 ? qualified : ranked)
    .slice(0, 3)
    .map((recommendation, index) => ({
      ...recommendation,
      matchLabelSl: index === 0
        ? "Najboljše ujemanje"
        : recommendation.score >= 80
          ? "Zelo dobro ujemanje"
          : "Možna alternativa",
    }));

  return {
    needsAdvice: recommendations.length === 0,
    reasonSl: recommendations.length > 0
      ? `Primerjali smo ${products.length} dejanskih izdelkov glede na trdoto ${input.hardnessDgh.toLocaleString("sl-SI")} °dH, ${input.residents} oseb in ${bathroomLabel(input.bathrooms)}.`
      : "V trenutnem katalogu ni dovolj primernega izdelka za vnesene pogoje.",
    assumptions: {
      estimatedMonthlyUsageM3,
      targetFlowLitersPerMinute,
      targetResinVolumeLiters,
    },
    recommendations,
  };
}
