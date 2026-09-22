import type { MetadataRoute } from "next";

import { getIndexableProductSlugs } from "@/lib/catalog/repository";
import { guides } from "@/lib/content/guides";
import { absoluteUrl } from "@/lib/seo/site";

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
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productSlugs = await getIndexableProductSlugs();
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
    ...productSlugs.map((slug) => ({
      url: absoluteUrl(`/izdelki/${slug}`),
      lastModified: updated,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
