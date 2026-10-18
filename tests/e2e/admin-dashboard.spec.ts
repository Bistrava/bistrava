import { expect, test } from "@playwright/test";

test("local administration exposes the catalog without inventing connected sales data", async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/admin");
  await expect(page.getByRole("alert").filter({ hasText: "Podatkov nadzorne plošče ni mogoče naložiti" })).toBeVisible();
  await expect(page.getByText("Lokalni predogled", { exact: true })).toBeVisible();
  await expect(page.locator(".admin-stat-card")).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Nastavitve zasebnosti" })).toHaveCount(0);
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  // Wait for client hydration through an observable interaction before taking
  // the first screenshot and navigating a freshly compiled development route.
  await page.getByRole("button", { name: "Preklopite skrbniško okolje v francoščino" }).click();
  await expect(page.getByRole("button", { name: "Passer l’administration en slovène" })).toBeVisible();
  await page.getByRole("button", { name: "Passer l’administration en slovène" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Podatkov nadzorne plošče ni mogoče naložiti" })).toBeVisible();
  await page.screenshot({
    path: `test-results/admin-dashboard-${testInfo.project.name}.png`,
    fullPage: true,
  });

  await page.getByRole("navigation", { name: "Skrbniška navigacija" }).getByRole("link", { name: "Izdelki", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/izdelki$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Izdelki" })).toBeVisible();
  await expect(page.locator(".admin-product-row")).toHaveCount(24);
  await expect(page.getByRole("complementary", { name: "Nastavitve zasebnosti" })).toHaveCount(0);
  await page.screenshot({
    path: `test-results/admin-products-${testInfo.project.name}.png`,
    fullPage: true,
  });

  await page.getByPlaceholder("Ime, znamka ali SKU").fill("BIS-030");
  await expect(page.locator(".admin-product-row")).toHaveCount(1);
  await expect(page.getByText("Tabletirana sol", { exact: false })).toBeVisible();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);

  await page
    .getByRole("button", {
      name: "Preklopite skrbniško okolje v francoščino",
    })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Produits" })).toBeVisible();
  await expect(page.getByPlaceholder("Nom, marque ou SKU")).toHaveValue("BIS-030");
  await expect(page.getByRole("link", { name: "Tableau de bord" })).toBeVisible();

  await page.getByRole("link", { name: "Tableau de bord" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Le tableau de bord ne peut pas charger les données" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "Le tableau de bord ne peut pas charger les données" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Passer l’administration en slovène" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/admin-dashboard-fr-${testInfo.project.name}.png`,
    fullPage: true,
  });

  expect(browserErrors).toEqual([]);
});

test("the local product editor stays read-only without an administrator session", async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/admin/izdelki/test-trdote-vode");
  await expect(page.getByText("Urejanje izdelka", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(5);

  await expect(page.getByRole("tab", { name: "Prodaja" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Shrani izdelek" })).toBeDisabled();
  await expect(page.locator("fieldset[disabled]")).toHaveCount(1);

  await page.reload();
  await expect(page.getByRole("button", { name: "Shrani izdelek" })).toBeDisabled();
  // Wait for hydration through an actual interaction before screenshot caret styling.
  await page.getByRole("button", { name: "Preklopite skrbniško okolje v francoščino" }).click();
  await expect(page.getByRole("button", { name: "Passer l’administration en slovène" })).toBeVisible();
  await page.screenshot({
    path: `test-results/admin-product-editor-${testInfo.project.name}.png`,
    fullPage: true,
  });

  expect(browserErrors).toEqual([]);
});

test("administration sections expose their local or disconnected state", async ({ page }) => {
  const sections = [
    ["/admin/narocila", "Naročila"],
    ["/admin/zaloga", "Zaloga in premiki"],
    ["/admin/povprasevanja", "Sporočila kupcev"],
    ["/admin/vodici", "Vodniki in nasveti"],
    ["/admin/e-posta", "Prejeta pošta"],
    ["/admin/nastavitve", "Nastavitve"],
  ] as const;

  for (const [url, heading] of sections) {
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByText("Kmalu", { exact: true })).toHaveCount(0);
    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  }

  await page.goto("/admin/analitika");
  await expect(page.getByRole("alert").filter({ hasText: "Podatkov nadzorne plošče ni mogoče naložiti" })).toBeVisible();
  await expect(page.locator(".ops-chart")).toHaveCount(0);
});

test("orders expose complete order and customer records", async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/admin/narocila");
  await expect(page.getByText("Fiktivni predstavitveni podatki")).toBeVisible();
  await expect(page.locator(".admin-order-list > button")).toHaveCount(4);
  await expect(page.getByRole("complementary", { name: "Podrobnosti naročila" })).toContainText("BIS-DEMO-1042");
  await expect(page.getByRole("complementary", { name: "Podrobnosti naročila" })).toContainText("Aquaphor S550 P1");

  await page.getByRole("tab", { name: /Kupci/ }).click();
  await expect(page.locator(".admin-customer-list > button")).toHaveCount(3);
  await expect(page.getByRole("complementary", { name: "Kartoteka kupca" })).toContainText("Nina Kovač");
  await expect(page.getByRole("complementary", { name: "Kartoteka kupca" })).toContainText("Dunajska cesta 100");
  await expect(page.getByRole("complementary", { name: "Kartoteka kupca" })).toContainText("BIS-DEMO-1042");
  await page.screenshot({ path: `test-results/admin-customers-${testInfo.project.name}.png`, fullPage: true });

  await page.getByRole("button", { name: "Preklopite skrbniško okolje v francoščino" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Commandes" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Clients/ })).toBeVisible();
  expect(browserErrors).toEqual([]);
});
