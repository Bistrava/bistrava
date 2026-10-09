import type { MetadataRoute } from "next";

import { getActiveCatalogProducts } from "@/lib/catalog/repository";
import { getPublishedGuides } from "@/lib/content/guides-repository";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

const marketingRoutes = [
  "",
  "/mehcalci-vode",
  "/mehcalne-naprave",
  "/trda-voda",
  "/mehcalec-vode-za-hiso",
  "/mehcalec-vode-za-stanovanje",
  "/sol-za-mehcalec-vode",
  "/test-trdote-vode",
  "/izbira-mehcalca",
  "/vodici",
  "/pogosta-vprasanja",
  "/o-nas",
  "/kontakt",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, guides] = await Promise.all([getActiveCatalogProducts(), getPublishedGuides()]);
  const updated = new Date("2026-08-23T00:00:00.000Z");
  return [
    ...marketingRoutes.map((path) => ({
      url: absoluteUrl(path || "/"),
      lastModified: updated,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.75,
    })),
    ...guides
      .filter((guide) => guide.status === "published")
      .map((guide) => ({
        url: absoluteUrl(`/vodici/${guide.slug}`),
        lastModified: new Date(guide.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.65,
      })),
    ...products.map((product) => ({
      url: absoluteUrl(`/izdelki/${product.slug}`),
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
