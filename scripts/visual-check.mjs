import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const baseUrl = process.env.BISTRAVA_PREVIEW_URL || "http://localhost:3000";
const outputDirectory = resolve(".tmp", "visual-check");
const viewports = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "tablet-768", width: 768, height: 900 },
  { name: "desktop-1440", width: 1440, height: 960 },
];
const cartFixture = [
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
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch();
const report = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => {
      window.localStorage.setItem("bistrava-consent-v1", "denied");
    });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.screenshot({
      path: resolve(outputDirectory, `home-${viewport.name}.png`),
      fullPage: false,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    report.push({ route: "/", viewport: viewport.name, status: response?.status(), overflow, errors });
    await context.close();
  }

  const context = await browser.newContext({ viewport: viewports[2] });
  await context.addInitScript(() => {
    window.localStorage.setItem("bistrava-consent-v1", "denied");
  });
  const page = await context.newPage();
  for (const route of ["/mehcalci-vode", "/izbira-mehcalca", "/izdelki/mehcalec-vode-12-l"]) {
    const slug = route.replaceAll("/", "-").replace(/^-/, "");
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: resolve(outputDirectory, `${slug}-desktop-1440.png`),
      fullPage: false,
    });
  }
  await page.evaluate((cart) => {
    window.localStorage.setItem("bistrava-cart-v1", JSON.stringify(cart));
  }, cartFixture);
  for (const route of ["/kosarica", "/blagajna"]) {
    const slug = route.replaceAll("/", "-").replace(/^-/, "");
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: resolve(outputDirectory, `${slug}-desktop-1440.png`),
      fullPage: false,
    });
  }
  await context.close();

  const mobileContext = await browser.newContext({ viewport: viewports[0] });
  await mobileContext.addInitScript((cart) => {
    window.localStorage.setItem("bistrava-consent-v1", "denied");
    window.localStorage.setItem("bistrava-cart-v1", JSON.stringify(cart));
  }, cartFixture);
  const mobilePage = await mobileContext.newPage();
  for (const route of ["/kosarica", "/blagajna"]) {
    const slug = route.replaceAll("/", "-").replace(/^-/, "");
    await mobilePage.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await mobilePage.screenshot({
      path: resolve(outputDirectory, `${slug}-mobile-360.png`),
      fullPage: false,
    });
  }
  await mobileContext.close();
} finally {
  await browser.close();
}

console.log(JSON.stringify({ outputDirectory, report }, null, 2));
