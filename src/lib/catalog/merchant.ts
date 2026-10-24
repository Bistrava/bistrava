import identifierData from "@/lib/catalog/merchant-identifiers.verified.json";
import { normalizeGtin } from "@/lib/catalog/gtin";
import type { CatalogProduct } from "@/types/catalog";

type VerifiedMerchantIdentifiers = {
  id: string;
  /** Present when research settled the manufacturer brand; null means an unbranded product. */
  brand?: string | null;
  gtin: string | null;
  mpn: string | null;
  googleProductCategory: number;
  identifierExists?: boolean;
  sources: string[];
  note: string;
};

const verifiedIdentifiers = new Map(
  (identifierData as VerifiedMerchantIdentifiers[]).map((entry) => [entry.id, entry]),
);

// Placeholder brands from the source workbook are not manufacturer brands.
const genericBrands = new Set(["Več blagovnih znamk", "Standard"]);

// Google product taxonomy IDs (taxonomy-with-ids.en-US.txt).
const categoryFallback: Record<string, number> = {
  "mehcalci-vode": 1952,
  "ciljna-zascita": 2055,
  "meritve-in-montaza": 2171,
  "sol-in-vzdrzevanje": 2171,
};

export type MerchantIdentity = {
  brand: string | null;
  gtin: string | null;
  mpn: string | null;
  googleProductCategory: number | null;
  /** false only when research confirmed the product has no manufacturer identifiers. */
  identifierExists: boolean | null;
};

export function getMerchantIdentity(product: CatalogProduct): MerchantIdentity {
  const verified = verifiedIdentifiers.get(product.sku);
  const gtin = normalizeGtin(product.gtin) ?? normalizeGtin(verified?.gtin);
  const mpn = product.mpn?.trim() || verified?.mpn || null;
  const brand = verified && "brand" in verified
    ? verified.brand ?? null
    : genericBrands.has(product.brand.trim()) ? null : product.brand.trim() || null;
  return {
    brand,
    gtin,
    mpn,
    googleProductCategory: verified?.googleProductCategory ?? categoryFallback[product.categorySlug] ?? null,
    identifierExists: gtin || mpn ? true : verified?.identifierExists === false ? false : null,
  };
}
