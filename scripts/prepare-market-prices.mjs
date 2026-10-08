import { readFileSync, writeFileSync } from "node:fs";

const groups = ["filters", "softeners", "accessories"];
const rows = groups.flatMap((group) => JSON.parse(readFileSync(`data/research/prices-2026-10-08-${group}.json`, "utf8")));
if (rows.length !== 24 || new Set(rows.map((row) => row.id)).size !== 24) throw new Error("Expected 24 unique researched products.");
const prices = rows.sort((a, b) => a.id.localeCompare(b.id)).map((row) => {
  if (!row.observations.length || row.observations.some((offer) => !Number.isInteger(offer.priceCents) || offer.priceCents <= 0 || offer.includesVat !== true)) {
    throw new Error(`Missing supported VAT-inclusive price for ${row.id}`);
  }
  if (new Set(row.observations.map((offer) => offer.merchant)).size !== row.observations.length) throw new Error(`Duplicate merchant for ${row.id}`);
  return {
    ...row,
    observedAt: "2026-10-08",
    priceCents: Math.round(row.observations.reduce((total, offer) => total + offer.priceCents, 0) / row.observations.length),
    basis: row.observations.length === 1 ? "single_merchant_reference" : row.id === "BIS-030" ? "comparable_specification_mean" : "matched_model_mean",
    currency: "EUR",
    includesVat: true,
    excludesShippingAndInstallation: true,
    ...(row.id === "BIS-074" ? { selectedConnection: "3/4″" } : {}),
  };
});
writeFileSync("data/research/market-prices-2026-10-08.json", JSON.stringify(prices, null, 2) + "\n");
const report = [
  "# Bistrava — relevé des prix du 8 octobre 2026",
  "",
  "Les 24 prix ci-dessous sont des prix de vente TTC en euros, hors livraison et installation. Le stock de 15 unités par référence a été fixé sur instruction du propriétaire (360 unités au total).",
  "",
  "Google Shopping Slovénie n'a pas été accessible aux outils de recherche. Ces montants ne sont donc pas présentés comme des moyennes Google Shopping. Les recherches ont été recoupées sur les sites marchands slovènes. Trois références disposent de plusieurs offres comparables ; les 21 autres utilisent le prix d'un seul marchand identifié.",
  "",
  "La moyenne arithmétique est arrondie au centime. Un marchand n'est compté qu'une fois, même lorsqu'il vend également sur une marketplace. Les prix barrés, frais de port, montages, formats et modèles différents sont exclus. Pour le sel, la comparaison porte sur des sacs de 25 kg de même spécification EN 973 type A, sans identité de marque/GTIN garantie. Le Core 110 est rapproché par fabricant, modèle et caractéristiques.",
  "",
  "Les pages Tehnofan bloquent la vérification directe ; leurs prix sont issus des pages marchandes indexées. Le prix MESEC du sel provient aussi d'une page indexée. Les limites propres à chaque observation sont conservées dans market-prices-2026-10-08.json. Un prix public concurrent n'est pas un coût d'achat ni une marge commerciale validée.",
  "",
  "| Référence | Produit | Prix TTC | Base | Sources |",
  "|---|---|---:|---|---|",
  ...prices.map((row) => `| ${row.id} | ${row.name} | ${(row.priceCents / 100).toFixed(2).replace(".", ",")} € | ${row.observations.length === 1 ? "Prix unique relevé" : `Moyenne de ${row.observations.length} offres`} | ${row.observations.map((offer) => `[${offer.merchant}](${offer.url})`).join(", ")} |`),
  "",
  "Wireless Water Guard BIS-074 : la fiche commercialisée à 200 € correspond au kit 3/4″ avec un capteur. La version 1″ à 208 € n'est pas incluse dans cette référence.",
  "",
  "La publication des prix et du stock ne configure pas les moyens de paiement ni les tarifs de livraison. Ces paramètres restent nécessaires à l'ouverture des commandes.",
  "",
];
writeFileSync("data/research/prix-bistrava-2026-10-08.md", report.join("\n"));
console.table(prices.map((row) => ({ sku: row.id, euros: (row.priceCents / 100).toFixed(2), offers: row.observations.length, basis: row.basis })));
