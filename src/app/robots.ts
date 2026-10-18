import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  if (process.env.ROBOTS_INDEXING_ENABLED === "false") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/blagajna",
        "/iskanje",
        "/kosarica",
        "/narocilo/",
        "/primerjava",
        "/izdelek/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
