import { expect, test } from "@playwright/test";

test("homepage presents the specialist positioning and primary journeys", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Mehka voda. Manj vodnega kamna. Več udobja doma.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Izberite pravi mehčalec" }).first()).toBeVisible();
  await expect(page.getByText("Trenutno ni aktivnih spletnih izdelkov.")).toBeVisible();
  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(structuredData.some((value) => value.includes('"@type":"FAQPage"'))).toBe(true);
});

test("specialist catalog separates drafts from active offers", async ({ page }) => {
  await page.goto("/mehcalci-vode");
  await expect(page.getByRole("heading", { level: 1, name: /Mehčalci vode za manj vodnega kamna/ })).toBeVisible();
  await expect(page.getByText("24 specializiranih osnutkov")).toBeVisible();
  await expect(page.locator(".catalog-product-card")).toHaveCount(24);
  await Promise.all([
    page.waitForURL(/\/izdelki\//),
    page.locator(".catalog-product-card h3 a").first().click(),
  ]);
  await expect(page.getByText("Osnutek - izdelek ni v prodaji")).toBeVisible();
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

test("configurator shows contact details only after a deterministic result", async ({ page }) => {
  await page.goto("/izbira-mehcalca");
  await expect(page.getByLabel("Ime in priimek")).toHaveCount(0);
  await page.getByLabel("Trdote še ne poznam").uncheck();
  await page.getByLabel("Trdota vode v °dH").fill("16");
  await page.getByRole("button", { name: "Naprej" }).click();
  await page.getByRole("button", { name: "Naprej" }).click();
  await page.getByRole("button", { name: "Prikažite rezultat" }).click();
  await expect(page.getByRole("heading", { name: "Priporočeni profili rešitve" })).toBeVisible();
  await expect(page.getByLabel("Ime in priimek")).toBeVisible();
  await expect(page.locator(".recommendation-grid article")).toHaveCount(2);
});

test("mobile menu exposes the required navigation", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "Mobile project only");
  await page.goto("/");
  await page.getByLabel("Odpri meni").click();
  const navigation = page.getByRole("navigation", { name: "Mobilna navigacija" });
  await expect(navigation.getByRole("link", { name: "Mehčalci vode", exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Rešitve proti vodnemu kamnu" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Izbira mehčalca" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Montaža in servis" })).toBeVisible();
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
    "/montaza-mehcalca-vode",
    "/servis-mehcalnih-naprav",
    "/sol-za-mehcalec-vode",
    "/test-trdote-vode",
    "/izbira-mehcalca",
    "/vodici",
    "/pogosta-vprasanja",
    "/o-nas",
    "/kontakt",
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

test("contact form preserves UTM attribution without exposing it", async ({ page }) => {
  await page.goto("/kontakt?utm_source=google&utm_medium=cpc&utm_campaign=mehka-voda");
  await expect(page.locator('input[name="utmSource"]')).toHaveValue("google");
  await expect(page.locator('input[name="utmMedium"]')).toHaveValue("cpc");
  await expect(page.locator('input[name="utmCampaign"]')).toHaveValue("mehka-voda");
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
