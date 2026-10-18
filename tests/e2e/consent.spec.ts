import { expect, test, type Page } from "@playwright/test";

const consentKey = "bistrava-consent-v2";
const dummyGa4Url = "https://www.googletagmanager.com/gtag/js?id=G-BISTRAVATEST";

async function interceptGoogleTags(page: Page) {
  const requests: string[] = [];
  // Replace Google scripts locally, and intercept any unexpected Google request too.
  await page.route(/https:\/\/(?:[^/]+\.)?(?:googletagmanager\.com|google-analytics\.com|googleadservices\.com|googletagservices\.com|googlesyndication\.com|doubleclick\.net|google\.com|googleapis\.com|gstatic\.com)\//, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "/* Google requests are intentionally replaced in this consent test. */",
    });
  });
  return requests;
}

async function googleConsentCommands(page: Page) {
  return page.evaluate(() => (window.dataLayer ?? [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter(([command]) => command === "consent")
    .map(([, , settings]) => settings));
}

test("legacy bundled consent is ignored and statistics loads only GA4 once with advertising denied", async ({ page }) => {
  const requests = await interceptGoogleTags(page);
  await page.addInitScript(() => {
    localStorage.setItem("bistrava-consent-v1", "granted");
  });
  await page.goto("/");
  const banner = page.getByRole("complementary", { name: "Nastavitve zasebnosti" });
  await expect(banner).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(await page.evaluate((key) => localStorage.getItem(key), consentKey)).toBeNull();

  await banner.getByRole("button", { name: "Dovoli statistiko" }).click();
  await expect(banner).toHaveCount(0);
  await expect.poll(() => requests).toEqual([dummyGa4Url]);
  await expect(page.locator("#ga4-config")).toHaveCount(1);
  expect(await page.evaluate((key) => localStorage.getItem(key), consentKey)).toBe("statistics");

  const consents = await googleConsentCommands(page);
  expect(consents.length).toBeGreaterThan(0);
  for (const consent of consents) {
    expect(consent).toMatchObject({ ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  }
  expect(consents.at(-1)).toMatchObject({ analytics_storage: "granted" });
  expect(await page.evaluate(() => (window.dataLayer ?? [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter(([command]) => command === "config"))).toEqual([
    ["config", "G-BISTRAVATEST", { send_page_view: true }],
  ]);

  await page.getByRole("button", { name: "Nastavitve zasebnosti", exact: true }).click();
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Dovoli statistiko" }).click();
  await expect(banner).toHaveCount(0);
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(1);
  expect(requests).toEqual([dummyGa4Url]);
});

test("essential-only choice persists, permits the cart and can be reopened", async ({ page }) => {
  const requests = await interceptGoogleTags(page);
  await page.goto("/");
  const banner = page.getByRole("complementary", { name: "Nastavitve zasebnosti" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Samo bistveno" }).click();
  await expect(banner).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), consentKey)).toBe("denied");

  await page.goto("/kosarica");
  await expect(page.getByRole("heading", { name: "Vaša košarica je prazna." })).toBeVisible();
  await expect.poll(async () => (await googleConsentCommands(page)).length).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Nastavitve zasebnosti", exact: true }).click();
  await expect(banner).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
  expect(requests).toEqual([]);
  expect((await googleConsentCommands(page)).at(-1)).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
  await banner.getByRole("button", { name: "Samo bistveno" }).click();
  await expect(banner).toHaveCount(0);
});

test("withdrawing statistics saves denial and reloads without requesting tags again", async ({ page }) => {
  const requests = await interceptGoogleTags(page);
  await page.goto("/");
  const banner = page.getByRole("complementary", { name: "Nastavitve zasebnosti" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Dovoli statistiko" }).click();
  await expect.poll(() => requests).toEqual([dummyGa4Url]);
  await expect(page.locator("#ga4-config")).toHaveCount(1);

  await page.getByRole("button", { name: "Nastavitve zasebnosti", exact: true }).click();
  await expect(banner).toBeVisible();
  const reloaded = page.waitForEvent("domcontentloaded");
  await banner.getByRole("button", { name: "Samo bistveno" }).click();
  await reloaded;
  expect(await page.evaluate((key) => localStorage.getItem(key), consentKey)).toBe("denied");
  expect(await page.evaluate(() => (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming).type)).toBe("reload");

  await expect.poll(async () => (await googleConsentCommands(page)).length).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Nastavitve zasebnosti", exact: true }).click();
  await expect(banner).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
  await expect(page.locator("#ga4-config")).toHaveCount(0);
  expect(requests).toEqual([dummyGa4Url]);
  expect((await googleConsentCommands(page)).at(-1)).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
});
