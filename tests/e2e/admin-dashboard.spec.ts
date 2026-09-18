import { expect, test } from "@playwright/test";

test("local administration preview exposes the catalog workflow", async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Nadzorna plošča" })).toBeVisible();
  await expect(page.getByText("Lokalni predogled administracije")).toBeVisible();
  await expect(page.getByText("24", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Nastavitve zasebnosti" })).toHaveCount(0);
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/admin-dashboard-${testInfo.project.name}.png`,
    fullPage: true,
  });

  await page.getByRole("link", { name: "Odprite izdelke" }).click();
  await expect(page).toHaveURL(/\/admin\/izdelki$/);
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
  await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Passer l’administration en slovène" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/admin-dashboard-fr-${testInfo.project.name}.png`,
    fullPage: true,
  });

  expect(browserErrors).toEqual([]);
});

test("every product opens in a complete local editor", async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/admin/izdelki/test-trdote-vode");
  await expect(page.getByText("Urejanje izdelka", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(5);

  await page.getByRole("tab", { name: "Prodaja" }).click();
  await page.locator('input[name="priceEuros"]').fill("19,90");
  await page.getByRole("tab", { name: "SEO" }).click();
  await page.locator('textarea[name="tags"]').fill("meritev, trdota vode, test");
  await page.getByRole("button", { name: "Shrani izdelek" }).click();
  await expect(page.getByText("Lokalni osnutek je shranjen v tem brskalniku.")).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Prodaja" }).click();
  await expect(page.locator('input[name="priceEuros"]')).toHaveValue("19,90");
  await page.screenshot({
    path: `test-results/admin-product-editor-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ponastavi" }).click();
  await expect(page.locator('input[name="priceEuros"]')).toHaveValue("");

  expect(browserErrors).toEqual([]);
});

test("all administration sections are active", async ({ page }) => {
  const sections = [
    ["/admin/narocila", "Naročila"],
    ["/admin/zaloga", "Zaloga"],
    ["/admin/povprasevanja", "Povpraševanja"],
    ["/admin/vodici", "Vodiči"],
    ["/admin/e-posta", "E-pošta"],
    ["/admin/analitika", "Analitika"],
    ["/admin/nastavitve", "Nastavitve"],
  ] as const;

  for (const [url, heading] of sections) {
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByText("Kmalu", { exact: true })).toHaveCount(0);
    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  }
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
