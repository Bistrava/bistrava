// Synthetic fixtures for a throwaway Supabase CLI stack only. No production credentials or mail.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

export const LOCAL_CHECKOUT_FIXTURE = {
  adminEmail: "checkout-admin@example.test",
  adminPassword: "Local-checkout-test-only-2026!",
  productId: "e2e00000-0000-4000-8000-000000000001",
  zoneId: "e2e00000-0000-4000-8000-000000000002",
  rateId: "e2e00000-0000-4000-8000-000000000003",
  sku: "E2E-BANK-001",
  slug: "e2e-bank-transfer",
  name: "Preizkusni izdelek za lokalno naročilo",
  stock: 3,
  subtotalCents: 1220,
  shippingCents: 450,
  totalCents: 1670,
  bank: { beneficiary: "EXAMPLE TEST ONLY", iban: "GB82WEST12345698765432", bankName: "Example test bank", bic: "", currency: "EUR" },
};

export function assertLoopbackUrl(value, label = "URL") {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} must be an explicit loopback HTTP URL.`); }
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    || url.username || url.password || !url.port || url.search || url.hash) {
    throw new Error(`${label} must be an explicit loopback HTTP URL, with a port and no credentials.`);
  }
  return url;
}

export function assertLocalCheckoutEnvironment(env = process.env) {
  if (env.BISTRAVA_CONNECTED_TEST !== "1" || env.CHECKOUT_ORDERING_ENABLED !== "true") {
    throw new Error("Connected checkout requires BISTRAVA_CONNECTED_TEST=1 and its isolated ordering gate enabled.");
  }
  const supabaseUrl = assertLoopbackUrl(env.NEXT_PUBLIC_SUPABASE_URL, "Supabase URL");
  const siteUrl = assertLoopbackUrl(env.NEXT_PUBLIC_SITE_URL, "Store URL");
  if (supabaseUrl.pathname !== "/" || siteUrl.pathname !== "/" || supabaseUrl.origin === siteUrl.origin) {
    throw new Error("Use separate loopback API and application origins, without path prefixes.");
  }
  for (const name of ["LWS_MAIL_PASSWORD", "RESEND_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO", "EMAIL_INTERNAL_TO",
    "NEXT_PUBLIC_GTM_ID", "NEXT_PUBLIC_GA4_ID", "NEXT_PUBLIC_GOOGLE_ADS_ID", "SUPABASE_ACCESS_TOKEN"]) {
    if (env[name]?.trim()) throw new Error(`${name} must remain empty during isolated checkout verification.`);
  }
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = env.SUPABASE_SECRET_KEY;
  if (!publishableKey || publishableKey.length < 20 || !secretKey || secretKey.length < 20) {
    throw new Error("Supabase CLI local API keys are required; do not supply production credentials.");
  }
  return { supabaseUrl: supabaseUrl.origin, siteUrl: siteUrl.origin, publishableKey, secretKey };
}

export function loadLocalCliStatus(source, env = process.env) {
  const values = Object.fromEntries(source.split(/\r?\n/).flatMap((line) => {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match) return [];
    const raw = match[2];
    return [[match[1], raw.startsWith('"') ? JSON.parse(raw) : raw]];
  }));
  assertLoopbackUrl(values.API_URL, "Supabase CLI API URL");
  env.NEXT_PUBLIC_SUPABASE_URL = values.API_URL;
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = values.PUBLISHABLE_KEY || values.ANON_KEY;
  env.SUPABASE_SECRET_KEY = values.SECRET_KEY || values.SERVICE_ROLE_KEY;
  env.NEXT_PUBLIC_SITE_URL ||= "http://127.0.0.1:3200";
  return assertLocalCheckoutEnvironment(env);
}

export function createLocalCheckoutClients(env = process.env) {
  const config = assertLocalCheckoutEnvironment(env);
  const localFetch = (input, init) => {
    const target = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (target.origin !== config.supabaseUrl) throw new Error("Supabase test request blocked: unexpected origin.");
    return fetch(input, { ...init, redirect: "error" });
  };
  const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: localFetch } };
  return {
    config,
    privileged: createClient(config.supabaseUrl, config.secretKey, options),
    publicClient: createClient(config.supabaseUrl, config.publishableKey, options),
    adminSession: createClient(config.supabaseUrl, config.publishableKey, options),
  };
}

function checked(result, operation) {
  if (result.error) throw new Error(`${operation} failed (${result.error.code || result.error.status || "request_error"}). Check local migrations, grants and RLS.`);
  return result.data;
}

export async function verifyLocalCheckoutRestAccess(clients) {
  const fixture = LOCAL_CHECKOUT_FIXTURE;
  const product = checked(await clients.publicClient.from("products")
    .select("id,sku,price_cents,stock_quantity,product_images(storage_path),product_categories(categories(slug))")
    .eq("id", fixture.productId).single(), "Anonymous storefront REST read");
  assert.equal(product.sku, fixture.sku);
  assert.equal(product.price_cents, fixture.subtotalCents);
  const rate = checked(await clients.publicClient.from("shipping_rates")
    .select("id,price_cents,shipping_zones!inner(country_codes)").eq("id", fixture.rateId).single(), "Anonymous shipping REST read");
  assert.equal(rate.price_cents, fixture.shippingCents);
  const bankAccess = await clients.publicClient.from("payment_settings").select("bank_details");
  assert.equal(bankAccess.error?.code, "42501", "Bank configuration must be denied through anonymous REST.");
  const settings = checked(await clients.adminSession.from("payment_settings").select("configured,enabled,revision").single(), "Authenticated admin REST read");
  assert.equal(settings.configured, true);
  assert.equal(settings.enabled, true);
  assert.equal(settings.revision, 1);
}

export async function seedLocalCheckout() {
  const clients = createLocalCheckoutClients();
  const fixture = LOCAL_CHECKOUT_FIXTURE;
  const orders = await clients.privileged.from("orders").select("id", { count: "exact", head: true });
  checked(orders, "Fresh local orders/grants check");
  assert.equal(orders.count, 0, "Refusing to seed a database containing orders. Reset the disposable local stack first.");
  const roles = await clients.privileged.from("admin_roles").select("profile_id", { count: "exact", head: true });
  checked(roles, "Fresh local roles/grants check");
  assert.equal(roles.count, 0, "Refusing to seed a database containing staff roles.");
  const existingProducts = checked(await clients.privileged.from("products").select("status"), "Fresh local catalog check");
  assert.ok(existingProducts.every((product) => product.status === "draft"), "Refusing to seed an existing active catalog.");
  const existingUsers = checked(await clients.privileged.auth.admin.listUsers({ page: 1, perPage: 1 }), "Fresh local Auth check");
  assert.equal(existingUsers.users.length, 0, "Refusing to seed a local stack containing existing Auth users.");

  const authUser = checked(await clients.privileged.auth.admin.createUser({
    email: fixture.adminEmail, password: fixture.adminPassword, email_confirm: true,
  }), "Synthetic local administrator creation");
  assert.ok(authUser.user?.id);
  const profile = checked(await clients.privileged.from("profiles").select("id").eq("id", authUser.user.id).single(), "Auth profile trigger check");
  assert.equal(profile.id, authUser.user.id);
  checked(await clients.privileged.from("admin_roles").insert({ profile_id: authUser.user.id, role: "admin", active: true }), "Local admin role fixture");
  checked(await clients.privileged.from("products").insert({
    id: fixture.productId, name: fixture.name, name_sl: fixture.name, slug: fixture.slug, brand: "E2E test only",
    short_description: "Synthetic product, available only in the disposable local checkout test.",
    status: "active", published_at: new Date(Date.now() - 60_000).toISOString(), archived_at: null,
    sku: fixture.sku, price_cents: fixture.subtotalCents, vat_rate: 22, currency: "EUR",
    sales_mode: "buy_now", stock_status: "in_stock", stock_quantity: fixture.stock,
  }), "Sellable local product fixture");
  checked(await clients.privileged.from("shipping_zones").insert({
    id: fixture.zoneId, name: "Local Slovenia test", country_codes: ["SI"], postal_code_patterns: [], active: true,
  }), "Local shipping zone fixture");
  checked(await clients.privileged.from("shipping_rates").insert({
    id: fixture.rateId, zone_id: fixture.zoneId, name: "Local test delivery", price_cents: fixture.shippingCents,
    currency: "EUR", active: true, min_order_cents: null, max_order_cents: null, estimated_days_min: 1, estimated_days_max: 3,
  }), "Local shipping rate fixture");
  checked(await clients.adminSession.auth.signInWithPassword({ email: fixture.adminEmail, password: fixture.adminPassword }), "Local admin password sign-in");
  const revision = checked(await clients.adminSession.rpc("save_admin_payment_settings", {
    input_expected_revision: 0, input_enabled: true, input_bank_details: fixture.bank,
  }), "Authenticated local bank configuration");
  assert.equal(revision, 1);
  await verifyLocalCheckoutRestAccess(clients);
  await clients.adminSession.auth.signOut();
  console.log(JSON.stringify({ status: "seeded", target: "loopback Supabase only", sku: fixture.sku, totalCents: fixture.totalCents, restGrantsVerified: true, emailDelivery: "disabled" }));
}

async function main() {
  const args = process.argv.slice(2);
  const statusIndex = args.indexOf("--status-file");
  if (statusIndex !== -1) {
    if (!args[statusIndex + 1]) throw new Error("--status-file requires the Supabase CLI local status file.");
    loadLocalCliStatus(await readFile(args[statusIndex + 1], "utf8"));
  }
  assertLocalCheckoutEnvironment();
  await seedLocalCheckout();
  if (args.includes("--run-tests")) {
    const result = await new Promise((resolveExit, reject) => {
      const child = spawn(process.execPath, [resolve("node_modules/@playwright/test/cli.js"), "test", "--config", "playwright.connected.config.ts"], { stdio: "inherit", env: process.env });
      child.once("error", reject);
      child.once("exit", (code) => resolveExit(code ?? 1));
    });
    process.exitCode = Number(result);
  }
}

if (process.argv[1] && basename(process.argv[1]) === "seed-checkout-local.mjs") {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
