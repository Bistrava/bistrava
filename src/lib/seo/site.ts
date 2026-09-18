export const siteConfig = {
  name: "Bistrava",
  tagline: "Mehka voda. Pametna izbira.",
  positioning: "Bistrava - strokovnjak za mehko vodo brez vodnega kamna",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://bistrava.com",
  locale: "sl-SI",
  currency: "EUR",
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
