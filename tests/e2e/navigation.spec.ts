import { expect, test } from "@playwright/test";

test("homepage presents the specialist shop and product journeys", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Izdelki za mehko vodo in dom brez vodnega kamna.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Nakupujte izdelke/ })).toBeVisible();
  await expect(page.locator(".catalog-product-card")).toHaveCount(6);
  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(structuredData.some((value) => value.includes('"@type":"FAQPage"'))).toBe(true);
});

test("specialist catalog displays every curated product", async ({ page }) => {
  await page.goto("/mehcalci-vode");
  await expect(page.getByRole("heading", { level: 1, name: /Izdelki za mehko vodo/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "24 izdelkov v štirih skupinah" })).toBeVisible();
  await expect(page.locator(".catalog-product-card")).toHaveCount(24);
  await expect(page.getByRole("button", { name: "V košarico" })).toHaveCount(24);
  await Promise.all([
    page.waitForURL(/\/izdelki\//),
    page.locator(".catalog-product-card h3 a").first().click(),
  ]);
  await expect(page.getByText("Izdelek v katalogu", { exact: true }).first()).toBeVisible();
});

test("a catalog product can be added to the persistent cart", async ({ page }) => {
  await page.goto("/mehcalci-vode");
  const firstProduct = page.locator(".catalog-product-card").first();
  const productName = await firstProduct.locator("h3").innerText();

  await firstProduct.getByRole("button", { name: "V košarico" }).click();
  await expect(firstProduct.getByRole("button", { name: "Dodano" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Košarica, 1 izdelkov" })).toBeVisible();

  await page.goto("/kosarica");
  await expect(page.getByRole("heading", { level: 1, name: "Košarica" })).toBeVisible();
  await expect(page.locator(".cart-line")).toHaveCount(1);
  await expect(page.locator(".cart-line h2")).toHaveText(productName);
});

test("draft product has a canonical URL and no Product or Offer schema", async ({ page }) => {
  await page.goto("/izdelki/mehcalec-vode-12-l");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://bistrava.com/izdelki/mehcalec-vode-12-l",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const jsonLd = page.locator('script[type="application/ld+json"]');
  await expect(jsonLd.filter({ hasText: '"@type":"Product"' })).toHaveCount(0);
  await expect(jsonLd.filter({ hasText: '"@type":"Offer"' })).toHaveCount(0);
  await expect(
    page.getByText("Javno objavljena cena pri viru", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("719,80 €")).toBeVisible();
  await expect(page.getByText(/ne predstavlja nabavne ali prodajne cene Bistrava/)).toBeVisible();
  await expect(page.locator(".product-gallery .product-media")).toHaveCount(4);
  await expect(page.getByRole("heading", { name: "Tehnične karakteristike" })).toBeVisible();
  await expect(page.getByText("Največji pretok", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Preverite trenutno ceno pri GGV/ })).toHaveAttribute(
    "href",
    "https://ggv.si/izdelek/ionska-mehcalna-naprava-elba12/",
  );
});

test("legacy product URL redirects to the Slovenian plural route", async ({ page }) => {
  await page.goto("/izdelek/mehcalec-vode-12-l");
  await expect(page).toHaveURL(/\/izdelki\/mehcalec-vode-12-l$/);
});

test("selection guide returns a result without collecting contact details", async ({ page }) => {
  await page.goto("/izbira-mehcalca");
  await expect(page.getByLabel("Ime in priimek")).toHaveCount(0);
  await page.getByLabel("Trdote še ne poznam").uncheck();
  await page.getByLabel("Trdota vode v °dH").fill("16");
  await page.getByRole("button", { name: "Naprej" }).click();
  await page.getByRole("button", { name: "Naprej" }).click();
  await page.getByRole("button", { name: "Prikažite rezultat" }).click();
  await expect(page.getByRole("heading", { name: "Priporočeni profili rešitve" })).toBeVisible();
  await expect(page.getByLabel("Ime in priimek")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Oglejte si izdelke/ })).toBeVisible();
  await expect(page.locator(".recommendation-grid article")).toHaveCount(2);
});

test("published guides contain complete practical articles", async ({ page }) => {
  await page.goto("/vodici");
  await expect(page.locator(".guide-list-card")).toHaveCount(10);
  await expect(page.getByText("Objavljen vodnik")).toHaveCount(10);
  await expect(page.getByText(/Osnutek vodnika/)).toHaveCount(0);

  await page.locator(".guide-list-card").first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Kaj je trda voda in zakaj nastaja vodni kamen" })).toBeVisible();
  await expect(page.locator(".article-body > section:not(.guide-comparison)")).toHaveCount(5);
  await expect(page.locator(".guide-comparison table")).toHaveCount(1);
  await expect(page.locator(".guide-comparison tbody tr")).toHaveCount(4);
  await expect(page.getByText("Trdota je merljiva lastnost vode", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Oglejte si izdelke" })).toBeVisible();
});

test("mobile menu exposes the required navigation", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "Mobile project only");
  await page.goto("/");
  await page.getByLabel("Odpri meni").click();
  const navigation = page.getByRole("navigation", { name: "Mobilna navigacija" });
  await expect(navigation.getByRole("link", { name: "Trgovina", exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Vodni kamen" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Vodnik za izbiro" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Vodniki", exact: true })).toBeVisible();
});

test("critical routes have content, no error overlay and no horizontal overflow", async ({ page }) => {
  test.setTimeout(120_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  for (const route of [
    "/",
    "/mehcalci-vode",
    "/mehcalne-naprave",
    "/vodni-kamen",
    "/trda-voda",
    "/mehcalec-vode-za-hiso",
    "/mehcalec-vode-za-stanovanje",
    "/sol-za-mehcalec-vode",
    "/test-trdote-vode",
    "/izbira-mehcalca",
    "/vodici",
    "/pogosta-vprasanja",
    "/o-nas",
  ]) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.ok(), route).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      route,
    ).toBe(true);
    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  }
  expect(browserErrors).toEqual([]);
});

test("robots, sitemap and Merchant feed are reachable", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Sitemap: https://bistrava.com/sitemap.xml");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("https://bistrava.com/mehcalci-vode");

  const feed = await request.get("/merchant-feed.xml");
  expect(feed.ok()).toBe(true);
  expect(await feed.text()).not.toContain("<item>");
});

test("privacy choice can be changed from the footer", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByRole("complementary", { name: "Nastavitve zasebnosti" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Samo bistveno" }).click();
  await expect(banner).toHaveCount(0);
  await page.getByRole("button", { name: "Nastavitve zasebnosti" }).click();
  await expect(banner).toBeVisible();
});

test("legacy service and contact pages redirect into the shop", async ({ page }) => {
  for (const route of ["/kontakt", "/montaza-mehcalca-vode", "/montaza-in-vzdrzevanje"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/mehcalci-vode$/);
  }
  await page.goto("/servis-mehcalnih-naprav");
  await expect(page).toHaveURL(/\/vodici$/);
});

test("guest cart persists quantities and checkout stays commercially gated", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "bistrava-cart-v1",
      JSON.stringify([
        {
          sku: "BIS-030",
          slug: "tabletirana-sol-25-kg",
          nameSl: "Tabletirana sol za mehčalne naprave – 25 kg",
          unitPriceCents: 1499,
          imageUrl: "/products/tabletirana-sol-25-kg/official-1.jpg",
          imageAltSl: "Tabletirana sol 25 kg",
          stockQuantity: 5,
          quantity: 2,
        },
      ]),
    );
  });

  await page.goto("/kosarica");
  await expect(page.getByRole("heading", { level: 1, name: "Košarica" })).toBeVisible();
  await expect(page.getByText("29,98 €").first()).toBeVisible();
  await page.getByRole("button", { name: "Povečaj količino" }).click();
  await expect(page.getByText("44,97 €").first()).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/blagajna$/, { timeout: 15_000 }),
    page.getByRole("link", { name: /Nadaljujte na blagajno/ }).click(),
  ]);
  await expect(page.getByText("Sprejem naročil še ni aktiviran")).toBeVisible();
  await expect(page.getByRole("button", { name: "Oddajte naročilo v pregled" })).toBeDisabled();
});

test("order references never expose guest orders without the private browser token", async ({ page }) => {
  await page.goto("/narocilo/BIS-260824-ABC12345");
  await expect(page.getByRole("heading", { name: "Podatki o naročilu niso dostopni." })).toBeVisible();
});
