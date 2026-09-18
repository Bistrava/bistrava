export type Category = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  problem: string;
  icon: "droplets" | "filter" | "gauge" | "home" | "shield" | "refresh";
};

export type CatalogPriority = "Prednost A" | "Prednost B" | "Test";
export type CatalogStatus = "draft" | "active" | "archived";
export type SalesMode = "buy_now" | "quote" | "installation_required";
export type StockStatus =
  | "in_stock"
  | "out_of_stock"
  | "backorder"
  | "unverified";

export type SourceCatalogProduct = {
  id: string;
  priority: CatalogPriority;
  sourceCategory: string;
  categorySlug: string;
  brand: string;
  name: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  searchIntent: string;
  slug: string;
  h1: string;
  seoTitle: string;
  sourceMetaDescription: string;
  researchSourceUrl: string;
  researchNote: string;
  seoScore: number;
  sourceRow: number;
};

export type ProductImage = {
  url: string;
  altSl: string;
  width?: number;
  height?: number;
  kind?: "official" | "information";
  sourceName?: string;
  sourceUrl?: string;
};

export type TechnicalSpecification = {
  labelSl: string;
  valueSl: string;
};

export type CatalogProduct = SourceCatalogProduct & {
  sourceCategorySlug: string;
  sku: string;
  status: CatalogStatus;
  technology: string;
  nameSl: string;
  shortDescriptionSl: string;
  descriptionSl: string;
  seoDescriptionSl: string;
  highlightsSl: string[];
  technicalSpecifications: TechnicalSpecification[];
  priceCents: number | null;
  supplierPriceCents: number | null;
  supplierPriceMaxCents: number | null;
  supplierPriceIncludesVat: boolean | null;
  supplierPriceSourceName: string | null;
  supplierPriceSourceUrl: string | null;
  supplierPriceObservedAt: string | null;
  supplierPriceNoteSl: string | null;
  compareAtPriceCents: number | null;
  vatRate: number;
  currency: "EUR";
  salesMode: SalesMode;
  stockStatus: StockStatus;
  /** Internal draft default requested by the owner; never exposed as verified availability. */
  stockQuantity: number;
  leadTimeDays: number | null;
  householdSizeMin: number | null;
  householdSizeMax: number | null;
  resinVolumeLiters: number | null;
  nominalFlowLitersPerMinute: number | null;
  maxFlowLitersPerMinute: number | null;
  connectionSize: string | null;
  regenerationMode: string | null;
  saltConsumptionKg: number | null;
  dimensions: string | null;
  weightKg: number | null;
  drainRequired: boolean | null;
  electricityRequired: boolean | null;
  bypassIncluded: boolean | null;
  installationRequired: boolean;
  warrantyMonths: number | null;
  certifications: string[];
  technicalDocuments: Array<{ title: string; url: string }>;
  images: ProductImage[];
  compatibleAccessories: string[];
  compatibleConsumables: string[];
  featured: boolean;
  canonical: string;
  createdAt: string;
  updatedAt: string;
};

export type CatalogCategoryDetails = {
  checks: [string, string, string];
  installation: string;
  suitabilityPrompt: string;
};
