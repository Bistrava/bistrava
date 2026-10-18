import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  LOCAL_CHECKOUT_FIXTURE as fixture,
  createLocalCheckoutClients,
  verifyLocalCheckoutRestAccess,
} from "../../scripts/seed-checkout-local.mjs";

type LocalClients = ReturnType<typeof createLocalCheckoutClients>;
type DatabaseRow = Record<string, unknown>;
type OrderRow = { id: string; reference: string; status: string; total_cents: number; updated_at: string };

async function restrictBrowserToLocal(context: BrowserContext, clients: LocalClients, blocked: string[]) {
  const allowed = new Set([clients.config.siteUrl, clients.config.supabaseUrl]);
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (["http:", "https:"].includes(url.protocol) && !allowed.has(url.origin)) {
      blocked.push(url.origin);
      await route.abort("blockedbyclient");
    } else {
      await route.continue();
    }
  });
  await context.addInitScript(() => localStorage.setItem("bistrava-consent-v2", "denied"));
}

async function rows(clients: LocalClients, table: string, column: string, value: string, select = "*") {
  const { data, error } = await clients.privileged.from(table).select(select).eq(column, value);
  if (error) throw new Error(`Local REST assertion on ${table} failed (${error.code}).`);
  return (data ?? []).map((row) => {
    if (typeof row !== "object" || row === null || Array.isArray(row)) throw new Error(`Invalid local REST row from ${table}.`);
    return row as unknown as DatabaseRow;
  });
}

async function orderBy(clients: LocalClients, column: "id" | "reference", value: string) {
  const orders = await rows(clients, "orders", column, value);
  expect(orders).toHaveLength(1);
  return orders[0] as unknown as OrderRow;
}

async function oneRow(clients: LocalClients, table: string, column: string, value: string) {
  const found = await rows(clients, table, column, value);
  expect(found).toHaveLength(1);
  return found[0];
}

async function stock(clients: LocalClients) {
  const products = await rows(clients, "products", "id", fixture.productId, "stock_quantity");
  expect(products).toHaveLength(1);
  return products[0].stock_quantity as number;
}

async function placeOrder(page: Page, clients: LocalClients, suffix: string) {
  await page.goto(`/izdelki/${fixture.slug}`);
  await expect(page.getByRole("heading", { level: 1, name: fixture.name })).toBeVisible();
  await page.getByRole("button", { name: "Dodaj v košarico", exact: true }).click();
  await expect(page.getByRole("button", { name: "Dodano v košarico", exact: true })).toBeVisible();
  await page.goto("/blagajna");
  const form = page.locator("form.checkout-layout");
  await expect(form).toBeVisible();
  for (const [name, value] of Object.entries({
    firstName: "Local", lastName: `Test ${suffix}`, email: `checkout-${suffix.toLowerCase()}@example.test`,
    phone: "+38640000000", addressLine1: "Synthetic street 1", postalCode: "1000", city: "Ljubljana",
  })) {
    await form.locator(`input[name="${name}"]`).fill(value);
  }
  await form.locator('select[name="shippingRateId"]').selectOption(fixture.rateId);
  await form.locator('input[name="termsAccepted"]').check();
  await expect(form.locator('input[name="expectedTotalCents"]')).toHaveValue(String(fixture.totalCents));
  await expect(form.locator('input[name="paymentSettingsVersion"]')).toHaveValue("db:1");
  const submit = form.getByRole("button", { name: "Naročilo z obveznostjo plačila", exact: true });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page).toHaveURL(/\/narocilo\/BIS-[A-Z0-9-]+$/);
  const reference = new URL(page.url()).pathname.split("/").at(-1)!;
  const instructions = page.getByRole("region", { name: "Podatki za bančno nakazilo" });
  await expect(instructions).toBeVisible();
  await expect(instructions).toContainText(fixture.bank.beneficiary);
  await expect(instructions).toContainText("GB82 WEST 1234 5698 7654 32");
  await expect(instructions).toContainText("16,70");
  await expect(instructions).toContainText(reference);
  const saved = await orderBy(clients, "reference", reference);
  expect(saved.status).toBe("awaiting_payment");
  expect(saved).toMatchObject({
    subtotal_cents: fixture.subtotalCents, shipping_cents: fixture.shippingCents, discount_cents: 0,
    total_cents: fixture.totalCents, tax_cents: 301, shipping_tax_cents: 81,
    checkout_mode: "bank_transfer", bank_transfer_snapshot: fixture.bank, reservation_expires_at: null,
  });
  expect(await oneRow(clients, "payments", "order_id", saved.id)).toMatchObject({
    provider: "bank_transfer", status: "pending", amount_cents: fixture.totalCents, paid_at: null,
  });
  expect(await oneRow(clients, "order_items", "order_id", saved.id)).toMatchObject({
    sku: fixture.sku, quantity: 1, unit_price_cents: fixture.subtotalCents, line_total_cents: fixture.subtotalCents,
  });
  const cookie = (await page.context().cookies()).find((item) => item.name === `bistrava-order-${reference.toLowerCase()}`);
  expect({ httpOnly: cookie?.httpOnly, sameSite: cookie?.sameSite, path: cookie?.path }).toEqual({
    httpOnly: true, sameSite: "Lax", path: `/narocilo/${reference}`,
  });
  expect(cookie?.value.length).toBeGreaterThanOrEqual(32);
  return saved;
}

async function saveOrder(adminPage: Page, clients: LocalClients, order: OrderRow, status: string) {
  await adminPage.goto(`/admin/narocila?order=${order.id}`);
  const form = adminPage.locator("form.admin-order-edit");
  await expect(form).toBeVisible();
  await expect(form.locator('input[name="orderId"]')).toHaveValue(order.id);
  await form.locator('select[name="status"]').selectOption(status);
  if (status === "paid") {
    await form.locator('input[name="paymentReference"]').fill("E2E-LOCAL-RECEIPT-B");
    await form.locator('input[name="paymentReceived"]').check();
  }
  if (status === "shipped") {
    await form.locator('select[name="shipmentStatus"]').selectOption("shipped");
    await form.locator('input[name="carrier"]').fill("Local test carrier");
    await form.locator('input[name="trackingNumber"]').fill("E2E-LOCAL-TRACK-B");
  }
  await form.locator('button[type="submit"]').click();
  await expect(form.getByRole("status")).toHaveText(/Naročilo in zgodovina sta shranjena\.|Commande et historique enregistrés\./);
  await expect.poll(async () => (await orderBy(clients, "id", order.id)).status).toBe(status);
}

// Register nothing in the existing disconnected preview suite, which never creates orders.
if (process.env.BISTRAVA_CONNECTED_TEST === "1") {
test.describe("connected checkout on disposable local Supabase", () => {

  test("private bank instructions, cancellation/restocking and recorded payment through shipment", async ({ page, context, browser }, testInfo) => {
    const clients = createLocalCheckoutClients();
    const blocked: string[] = [];
    await restrictBrowserToLocal(context, clients, blocked);
    const signedIn = await clients.adminSession.auth.signInWithPassword({ email: fixture.adminEmail, password: fixture.adminPassword });
    expect(signedIn.error).toBeNull();
    await verifyLocalCheckoutRestAccess(clients);
    expect(await stock(clients)).toBe(fixture.stock);
    const adminProfileId = (await oneRow(clients, "admin_roles", "role", "admin")).profile_id;

    const adminContext = await browser.newContext({ baseURL: clients.config.siteUrl, serviceWorkers: "block" });
    const strangerContext = await browser.newContext({ baseURL: clients.config.siteUrl, serviceWorkers: "block" });
    await restrictBrowserToLocal(adminContext, clients, blocked);
    await restrictBrowserToLocal(strangerContext, clients, blocked);
    const adminPage = await adminContext.newPage();
    try {
      await adminPage.goto("/admin/connexion");
      await adminPage.locator("#admin-email").fill(fixture.adminEmail);
      await adminPage.locator("#admin-password").fill(fixture.adminPassword);
      await adminPage.getByRole("button", { name: "Prijava", exact: true }).click();
      await expect(adminPage).toHaveURL(/\/admin$/);

      const first = await placeOrder(page, clients, "A");
      expect(await stock(clients)).toBe(2);
      const stranger = await strangerContext.newPage();
      const response = await stranger.goto(`/narocilo/${first.reference}`);
      expect(response?.status()).toBe(200);
      await expect(stranger.getByRole("heading", { level: 1, name: "Podatki o naročilu niso dostopni." })).toBeVisible();
      await expect(stranger.getByRole("region", { name: "Podatki za bančno nakazilo" })).toHaveCount(0);
      const anonymousOrders = await clients.publicClient.from("orders").select("id,reference").eq("id", first.id);
      expect(anonymousOrders.error?.code === "42501" || (!anonymousOrders.error && anonymousOrders.data?.length === 0)).toBe(true);

      await saveOrder(adminPage, clients, first, "cancelled");
      expect(await stock(clients)).toBe(fixture.stock);
      expect(await oneRow(clients, "payments", "order_id", first.id)).toMatchObject({ status: "cancelled", paid_at: null });
      const movements = await rows(clients, "product_inventory_movements", "order_id", first.id, "reason,quantity_delta,balance_after");
      expect(movements).toEqual(expect.arrayContaining([
        { reason: "reservation", quantity_delta: -1, balance_after: 2 },
        { reason: "release", quantity_delta: 1, balance_after: 3 },
      ]));
      expect(movements).toHaveLength(2);
      await saveOrder(adminPage, clients, first, "cancelled");
      expect(await stock(clients)).toBe(fixture.stock);
      expect(await rows(clients, "product_inventory_movements", "order_id", first.id)).toHaveLength(2);
      await page.goto(`/narocilo/${first.reference}`);
      await expect(page.getByText(/Naročilo je preklicano\. Zanj ne izvajajte nakazila\./)).toBeVisible();
      await expect(page.getByRole("region", { name: "Podatki za bančno nakazilo" })).toHaveCount(0);

      const second = await placeOrder(page, clients, "B");
      expect(second.id).not.toBe(first.id);
      expect(await stock(clients)).toBe(2);
      await saveOrder(adminPage, clients, second, "paid");
      const payment = await oneRow(clients, "payments", "order_id", second.id);
      expect(payment).toMatchObject({ provider: "bank_transfer", status: "paid", provider_reference: "E2E-LOCAL-RECEIPT-B", amount_cents: fixture.totalCents });
      expect(typeof payment.paid_at).toBe("string");
      const receiptAudit = await rows(clients, "audit_logs", "entity_id", String(payment.id), "action,actor_id,after_data");
      expect(receiptAudit).toEqual(expect.arrayContaining([expect.objectContaining({
        action: "payment.manual_receipt_confirmed", actor_id: adminProfileId,
        after_data: { status: "paid", reference: "E2E-LOCAL-RECEIPT-B", amount_cents: fixture.totalCents },
      })]));
      await page.goto(`/narocilo/${second.reference}`);
      await expect(page.getByText("Plačilo je potrjeno. Hvala za vaše naročilo.")).toBeVisible();
      await expect(page.getByRole("region", { name: "Podatki za bančno nakazilo" })).toHaveCount(0);

      await saveOrder(adminPage, clients, second, "processing");
      await saveOrder(adminPage, clients, second, "shipped");
      expect(await stock(clients)).toBe(2);
      const shipment = await oneRow(clients, "shipments", "order_id", second.id);
      expect(shipment).toMatchObject({ status: "shipped", carrier: "Local test carrier", tracking_number: "E2E-LOCAL-TRACK-B" });
      expect(typeof shipment.shipped_at).toBe("string");
      expect(await rows(clients, "product_inventory_movements", "order_id", second.id, "reason,quantity_delta,balance_after")).toEqual([
        { reason: "reservation", quantity_delta: -1, balance_after: 2 },
      ]);
      const audit = await rows(clients, "audit_logs", "entity_id", second.id, "action,actor_id,after_data");
      const updates = audit.filter((event) => event.action === "order.updated");
      expect(updates.map((event) => (event.after_data as { status: string }).status).sort()).toEqual(["paid", "processing", "shipped"]);
      expect(updates.every((event) => event.actor_id === adminProfileId)).toBe(true);
      await page.goto(`/narocilo/${second.reference}`);
      await expect(page.locator(".order-success-hero .section-kicker")).toHaveText("Odpremljeno");
      const emails = await clients.privileged.from("email_events").select("id", { count: "exact", head: true });
      expect(emails.error).toBeNull();
      expect(emails.count).toBe(0);
      expect(blocked).toEqual([]);
    } catch (error) {
      await adminPage.screenshot({ path: testInfo.outputPath("admin-failure.png"), fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await Promise.all([adminContext.close(), strangerContext.close(), clients.adminSession.auth.signOut()]);
    }
  });
});
}
