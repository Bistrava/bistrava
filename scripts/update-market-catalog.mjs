import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const expectedRef = "hdgmstfqgybxdwmdsard";
if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname !== `${expectedRef}.supabase.co`) {
  throw new Error("Unexpected Supabase project; no changes made.");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const expected = JSON.parse(readFileSync("src/lib/catalog/supplier-prices.verified.json", "utf8"));
const skus = expected.map((product) => product.id);
if (skus.length !== 24 || new Set(skus).size !== 24) throw new Error("Expected 24 unique products.");
const { data: before, error } = await db.from("products").select("*").in("sku", skus).order("sku");
if (error) throw error;
if (before.length !== 24) throw new Error(`Found ${before.length} products, expected 24.`);

const applyStock = process.argv.includes("--stock");
const applyPrices = process.argv.includes("--prices");
if (applyStock || applyPrices) {
  mkdirSync("tmp/catalog-backups", { recursive: true });
  writeFileSync(`tmp/catalog-backups/before-${Date.now()}.json`, JSON.stringify(before, null, 2));
}
if (applyStock) {
  const { data, error: stockError } = await db.from("products")
    .update({ stock_quantity: 15, stock_status: "in_stock" })
    .in("sku", skus).select("sku,stock_quantity,stock_status");
  if (stockError) throw stockError;
  if (data.length !== 24 || data.some((product) => product.stock_quantity !== 15 || product.stock_status !== "in_stock")) {
    throw new Error("Stock verification failed.");
  }
  console.log("Stock saved: 24 products, 15 units each, 360 units total.");
}
if (applyPrices) {
  const prices = JSON.parse(readFileSync("data/research/market-prices-2026-10-08.json", "utf8"));
  if (prices.length !== 24 || new Set(prices.map((product) => product.id)).size !== 24 ||
    prices.some((product) => !skus.includes(product.id) || !Number.isInteger(product.priceCents) || product.priceCents <= 0 || product.observations.length === 0)) {
    throw new Error("A sourced positive price is required for each of the 24 products.");
  }
  const now = new Date().toISOString();
  for (const price of prices) {
    const original = before.find((product) => product.sku === price.id);
    const update = {
      price_cents: price.priceCents,
      compare_at_price_cents: null,
      status: "active",
      published_at: original.published_at ?? now,
      archived_at: null,
      sales_mode: "buy_now",
      merchant_data: {
        ...original.merchant_data,
        draftOnly: false,
        marketPricing: { observedAt: "2026-10-08", basis: price.basis, observations: price.observations, notes: price.notes, googleShoppingVerified: price.googleShoppingVerified },
      },
    };
    if (price.id === "BIS-074") {
      update.name = "Wireless Water Guard 3/4″ – sistem proti izlitju vode";
      update.name_sl = update.name;
      update.connection_size = "3/4″";
      update.short_description_sl = "Wireless Water Guard s priključkom 3/4″ ob zaznavi vode zapre električni ventil. Komplet vključuje ventil in en brezžični senzor; podpira do pet senzorjev.";
      update.short_description = update.short_description_sl;
      update.description_sl = original.description_sl.replace("Na voljo sta priključka 3/4″ in 1″.", "Ta ponudba vključuje ventil s priključkom 3/4″ in en brezžični senzor.");
      update.description = update.description_sl;
      update.benefits = original.benefits.map((benefit) => benefit === "Priključek 3/4″ ali 1″" ? "Priključek 3/4″" : benefit);
      update.technical_specs = original.technical_specs.map((spec) => spec.labelSl === "Priključek ventila" ? { ...spec, valueSl: "3/4″" } : spec);
      update.seo_description = "Wireless Water Guard 3/4″ z ventilom in enim brezžičnim senzorjem. Ob zaznavi vode samodejno zapre glavni dovod; podpira do pet senzorjev.";
    }
    const { data, error: updateError } = await db.from("products").update(update)
      .eq("id", original.id).select("sku,price_cents,status").single();
    if (updateError) throw updateError;
    if (data.price_cents !== price.priceCents || data.status !== "active") throw new Error(`Price verification failed: ${price.id}`);
    console.log(`${data.sku}: EUR ${(data.price_cents / 100).toFixed(2)}, active`);
  }
}
const { data: final, error: finalError } = await db.from("products")
  .select("sku,name_sl,status,price_cents,supplier_price_cents,stock_quantity,stock_status,sales_mode")
  .in("sku", skus).order("sku");
if (finalError) throw finalError;
console.log(JSON.stringify(final, null, 2));
