import productData from "@/lib/catalog/seo-products.generated.json";
import verifiedProductContentData from "@/lib/catalog/product-content.verified.json";
import productMediaData from "@/lib/catalog/product-media.generated.json";
import supplierPriceData from "@/lib/catalog/supplier-prices.verified.json";
import type {
  CatalogCategoryDetails,
  CatalogProduct,
  Category,
  ProductImage,
  SourceCatalogProduct,
  TechnicalSpecification,
} from "@/types/catalog";

export const allCategories: Category[] = [
  {
    slug: "mehcalci-vode",
    name: "Mehčalci vode",
    shortName: "Mehčalci vode",
    description:
      "Centralne naprave za zmanjšanje trdote vode, ki jih je treba dimenzionirati glede na porabo, pretok in izmerjeno trdoto.",
    problem: "Trda voda in obloge vodnega kamna",
    icon: "droplets",
  },
  {
    slug: "ciljna-zascita",
    name: "Ciljna zaščita naprav",
    shortName: "Zaščita naprav",
    description:
      "Rešitve za posamezen grelnik ali gospodinjski aparat, kadar centralno mehčanje ni izbrana pot.",
    problem: "Zaščita posameznega porabnika",
    icon: "shield",
  },
  {
    slug: "meritve-in-montaza",
    name: "Meritve in montaža",
    shortName: "Meritve in montaža",
    description:
      "Pripomočki in elementi za preverjanje trdote ter strokovno pripravo vodovodnega priključka.",
    problem: "Podatki in pogoji pred izbiro",
    icon: "gauge",
  },
  {
    slug: "sol-in-vzdrzevanje",
    name: "Sol in vzdrževanje",
    shortName: "Sol in vzdrževanje",
    description:
      "Potrošni material za regeneracijo in redno vzdrževanje ionskih mehčalnih naprav.",
    problem: "Redno in načrtovano vzdrževanje",
    icon: "refresh",
  },
];

export const featuredCategories = allCategories;

const specialistIds = new Set([
  "BIS-008",
  "BIS-016",
  "BIS-020",
  "BIS-029",
  "BIS-030",
  "BIS-038",
  "BIS-040",
  "BIS-041",
  "BIS-054",
  "BIS-060",
  "BIS-061",
  "BIS-064",
  "BIS-066",
  "BIS-067",
  "BIS-069",
  "BIS-071",
  "BIS-074",
  "BIS-076",
  "BIS-077",
  "BIS-078",
  "BIS-082",
  "BIS-083",
  "BIS-084",
  "BIS-086",
]);

type VerifiedSupplierPrice = {
  id: string;
  priceCents: number;
  maxPriceCents: number | null;
  currency: "EUR";
  includesVat: boolean;
  sourceName: string;
  sourceUrl: string;
  observedAt: string;
  noteSl: string;
};

type VerifiedProductContent = {
  id: string;
  nameSl: string;
  technology: string;
  shortDescriptionSl: string;
  descriptionSl: string;
  seoTitle: string;
  seoDescriptionSl: string;
  highlightsSl: string[];
  technicalSpecifications: TechnicalSpecification[];
  typed: Partial<
    Pick<
      CatalogProduct,
      | "householdSizeMin"
      | "householdSizeMax"
      | "resinVolumeLiters"
      | "nominalFlowLitersPerMinute"
      | "maxFlowLitersPerMinute"
      | "connectionSize"
      | "regenerationMode"
      | "saltConsumptionKg"
      | "dimensions"
      | "weightKg"
      | "drainRequired"
      | "electricityRequired"
      | "bypassIncluded"
      | "installationRequired"
      | "warrantyMonths"
      | "certifications"
    >
  >;
};

type VerifiedProductMedia = {
  id: string;
  images: ProductImage[];
};

const verifiedSupplierPrices = new Map(
  (supplierPriceData as VerifiedSupplierPrice[]).map((price) => [price.id, price]),
);
const verifiedProductContent = new Map(
  (verifiedProductContentData as VerifiedProductContent[]).map((content) => [content.id, content]),
);
const verifiedProductMedia = new Map(
  (productMediaData as VerifiedProductMedia[]).map((media) => [media.id, media]),
);

function mapSpecialistCategory(product: SourceCatalogProduct) {
  if (product.categorySlug === "mehcalci-vode") return "mehcalci-vode";
  if (["BIS-029", "BIS-030"].includes(product.id)) {
    return "sol-in-vzdrzevanje";
  }
  if (["BIS-054", "BIS-074", "BIS-084"].includes(product.id)) {
    return "ciljna-zascita";
  }
  return "meritve-in-montaza";
}

function productCopy(product: SourceCatalogProduct, categorySlug: string) {
  const confirmations =
    "Pred aktivacijo ponudbe morajo biti pri dobavitelju potrjeni cena, dobavljivost, tehnične lastnosti, dokumentacija in pogoji garancije.";

  if (categorySlug === "mehcalci-vode") {
    return {
      technology: "Mehčanje vode - tehnologija čaka na dobaviteljsko potrditev",
      short:
        `${product.name} je osnutek produktne kartice za centralno mehčanje vode. ` +
        "Končna primernost je odvisna od trdote, porabe, pretoka in pogojev montaže.",
      long:
        `Kartica ${product.name} je ohranjena iz vhodnega kataloga kot kandidat za specializirano ponudbo Bistrava. ` +
        "Pred priporočilom bomo preverili način delovanja, količino ionske smole, delovni pretok, režim regeneracije, priključke, potrebo po odtoku in napajanju. " +
        confirmations,
    };
  }

  if (categorySlug === "sol-in-vzdrzevanje") {
    return {
      technology: "Potrošni material za mehčalne naprave",
      short:
        `${product.name} je osnutek kartice potrošnega materiala za načrtovano vzdrževanje mehčalne naprave.`,
      long:
        "Združljivost, sestava, pakiranje, način uporabe in interval menjave bodo objavljeni samo na podlagi uradnega dobaviteljskega lista. " +
        confirmations,
    };
  }

  if (categorySlug === "ciljna-zascita") {
    return {
      technology: "Ciljna zaščita - način delovanja čaka na potrditev",
      short:
        `${product.name} je kandidat za ciljno zaščito posamezne naprave ali vodovodnega odseka.`,
      long:
        "Ta vrsta rešitve ni samodejno enakovredna centralnemu mehčalcu vode. Pred uporabo je treba preveriti namen, način delovanja, priključke, dovoljeni tlak in navodila proizvajalca. " +
        confirmations,
    };
  }

  return {
    technology: "Meritev ali priprava vodovodnega priključka",
    short:
      `${product.name} je osnutek kartice za meritev, predpripravo ali podporo montaži mehčalne naprave.`,
    long:
      "Izdelek se bo v ponudbo vključil šele po preverbi merilnega območja oziroma priključnih mer, materialov, omejitev in uradnih navodil. " +
      confirmations,
  };
}

function enrichProduct(source: SourceCatalogProduct): CatalogProduct {
  const isSpecialist = specialistIds.has(source.id);
  const status = isSpecialist ? "draft" : "archived";
  const categorySlug = mapSpecialistCategory(source);
  const copy = productCopy(source, categorySlug);
  const content = verifiedProductContent.get(source.id);
  const media = verifiedProductMedia.get(source.id);
  if (isSpecialist && (!content || !media)) {
    throw new Error(`Missing verified content or media for ${source.id}`);
  }
  const typed = content?.typed ?? {};
  const installationRequired = typed.installationRequired ??
    (categorySlug === "mehcalci-vode" ||
      categorySlug === "meritve-in-montaza" ||
      categorySlug === "ciljna-zascita");
  const supplierPrice = verifiedSupplierPrices.get(source.id);

  return {
    ...source,
    h1: content?.nameSl ?? source.h1,
    seoTitle: content?.seoTitle ?? source.seoTitle,
    sourceMetaDescription: content?.seoDescriptionSl ?? source.sourceMetaDescription,
    researchSourceUrl: supplierPrice?.sourceUrl ?? source.researchSourceUrl,
    categorySlug,
    sourceCategorySlug: source.categorySlug,
    sku: source.id,
    status,
    technology: content?.technology ?? copy.technology,
    nameSl: content?.nameSl ?? source.name,
    shortDescriptionSl: content?.shortDescriptionSl ?? copy.short,
    descriptionSl: content?.descriptionSl ?? copy.long,
    seoDescriptionSl: content?.seoDescriptionSl ?? source.sourceMetaDescription,
    highlightsSl: content?.highlightsSl ?? [],
    technicalSpecifications: content?.technicalSpecifications ?? [],
    priceCents: null,
    supplierPriceCents: supplierPrice?.priceCents ?? null,
    supplierPriceMaxCents: supplierPrice?.maxPriceCents ?? null,
    supplierPriceIncludesVat: supplierPrice?.includesVat ?? null,
    supplierPriceSourceName: supplierPrice?.sourceName ?? null,
    supplierPriceSourceUrl: supplierPrice?.sourceUrl ?? null,
    supplierPriceObservedAt: supplierPrice?.observedAt ?? null,
    supplierPriceNoteSl: supplierPrice?.noteSl ?? null,
    compareAtPriceCents: null,
    vatRate: 22,
    currency: "EUR",
    salesMode: installationRequired ? "installation_required" : "buy_now",
    stockStatus: "unverified",
    stockQuantity: 5,
    leadTimeDays: null,
    householdSizeMin: typed.householdSizeMin ?? null,
    householdSizeMax: typed.householdSizeMax ?? null,
    resinVolumeLiters: typed.resinVolumeLiters ?? null,
    nominalFlowLitersPerMinute: typed.nominalFlowLitersPerMinute ?? null,
    maxFlowLitersPerMinute: typed.maxFlowLitersPerMinute ?? null,
    connectionSize: typed.connectionSize ?? null,
    regenerationMode: typed.regenerationMode ?? null,
    saltConsumptionKg: typed.saltConsumptionKg ?? null,
    dimensions: typed.dimensions ?? null,
    weightKg: typed.weightKg ?? null,
    drainRequired: typed.drainRequired ?? null,
    electricityRequired: typed.electricityRequired ?? null,
    bypassIncluded: typed.bypassIncluded ?? null,
    installationRequired,
    warrantyMonths: typed.warrantyMonths ?? null,
    certifications: typed.certifications ?? [],
    technicalDocuments: [],
    images: media?.images ?? [],
    compatibleAccessories: [],
    compatibleConsumables: [],
    featured: false,
    canonical: `/izdelki/${source.slug}`,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
  };
}

export const catalogProducts = (productData as SourceCatalogProduct[]).map(
  enrichProduct,
);
export const specialistProducts = catalogProducts.filter(
  (product) => product.status !== "archived",
);
export const activeProducts = specialistProducts.filter(
  (product) => product.status === "active",
);
export const archivedProducts = catalogProducts.filter(
  (product) => product.status === "archived",
);

const productsBySlug = new Map(
  catalogProducts.map((product) => [product.slug, product]),
);
const categoriesBySlug = new Map(
  allCategories.map((category) => [category.slug, category]),
);
const productsByCategory = new Map(
  allCategories.map((category) => [
    category.slug,
    catalogProducts.filter(
      (product) => product.categorySlug === category.slug,
    ),
  ]),
);

export const categoryDetails: Record<string, CatalogCategoryDetails> = {
  "mehcalci-vode": {
    checks: [
      "Izmerjena trdota vode",
      "Največji trenutni pretok in poraba gospodinjstva",
      "Prostor, odtok, električni priključek in možnost obvoda",
    ],
    installation:
      "Pred izbiro je treba preveriti trdoto, tlak, pretok, priključek, prostor, odtok in način regeneracije.",
    suitabilityPrompt:
      "Pripravite podatek o trdoti vode, številu oseb, kopalnicah in največji sočasni porabi.",
  },
  "ciljna-zascita": {
    checks: [
      "Naprava ali odsek, ki ga želite zaščititi",
      "Potrjen način delovanja rešitve",
      "Priključek, tlak in zahteve proizvajalca aparata",
    ],
    installation:
      "Ciljna zaščita se izbere glede na konkreten porabnik in ni samodejno nadomestilo za centralno mehčanje vode.",
    suitabilityPrompt:
      "Navedite model naprave, mesto priklopa, premer cevi in izmerjeno trdoto vode.",
  },
  "meritve-in-montaza": {
    checks: [
      "Meritev trdote ali razpoložljiv podatek dobavitelja vode",
      "Premer priključka, tlak in največji pretok",
      "Prostor za napravo, odtok, napajanje in servisni dostop",
    ],
    installation:
      "Montažna rešitev se določi po ogledu ali na podlagi dovolj natančnih fotografij in mer.",
    suitabilityPrompt:
      "Pošljite lokacijo, fotografije priključka ter podatke o tlaku, trdoti in razpoložljivem prostoru.",
  },
  "sol-in-vzdrzevanje": {
    checks: [
      "Točen model mehčalne naprave",
      "Vrsta in pakiranje potrošnega materiala",
      "Navodila proizvajalca in servisni interval",
    ],
    installation:
      "Uporabljajo se samo materiali, ki so skladni z navodili proizvajalca konkretne naprave.",
    suitabilityPrompt:
      "Navedite znamko, model in fotografijo oznake naprave ter trenutno uporabljeni material.",
  },
};

export function getCatalogProduct(slug: string) {
  return productsBySlug.get(slug);
}

export function getSpecialistProduct(slug: string) {
  const product = productsBySlug.get(slug);
  return product?.status === "archived" ? undefined : product;
}

export function getCatalogCategory(slug: string) {
  return categoriesBySlug.get(slug);
}

export function getProductsByCategory(categorySlug: string) {
  return productsByCategory.get(categorySlug) ?? [];
}

export function getCategoryDetails(categorySlug: string) {
  return categoryDetails[categorySlug] ?? categoryDetails["mehcalci-vode"];
}

export function getMerchantEligibleProducts(products = activeProducts) {
  return products.filter(
    (product) =>
      product.salesMode === "buy_now" &&
      product.priceCents !== null &&
      product.stockStatus === "in_stock" &&
      product.images.length > 0,
  );
}
