import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("uses the public domain for canonical URLs, robots and sitemap without an override", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  vi.resetModules();
  const { absoluteUrl, siteConfig } = await import("./site");
  const { default: robots } = await import("@/app/robots");

  expect(siteConfig.url).toBe("https://bistrava.com");
  expect(absoluteUrl("/mehcalci-vode")).toBe("https://bistrava.com/mehcalci-vode");
  expect(robots().sitemap).toBe("https://bistrava.com/sitemap.xml");
});

it("keeps an explicit local or preview URL override", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  vi.resetModules();
  const { absoluteUrl } = await import("./site");

  expect(absoluteUrl("/kontakt")).toBe("http://localhost:3000/kontakt");
});
