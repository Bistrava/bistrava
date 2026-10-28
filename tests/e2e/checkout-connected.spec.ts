import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";
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
  await expect(page).toHaveURL(/\/kosarica$/);
  await expect(page.getByRole("link", { name: fixture.name })).toBeVisible();
  await expect(page.getByRole("link", { name: "Nadaljuj z nakupovanjem" })).toHaveAttribute("href", "/mehcalci-vode#katalog");
  await page.getByRole("link", { name: /Nadaljujte na blagajno/ }).click();
  await expect(page).toHaveURL(/\/blagajna$/);
  const form = page.locator("form.checkout-layout");
  await expect(form).toBeVisible();
  await expect(page.getByText('Sprejem naročil še ni aktiviran')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Podatki za bančno nakazilo' })).toHaveCount(0);
  expect(await page.content()).not.toContain(fixture.bank.iban);
  expect(await page.content()).not.toContain(fixture.bank.beneficiary);
  await expect(form.getByText(/Po potrditvi naročila boste samodejno prejeli e-sporočilo/)).toBeVisible();
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
  await expect(page.getByRole("link", { name: "Nadaljuj z nakupovanjem" })).toHaveAttribute("href", "/mehcalci-vode#katalog");
  await expect(page.getByRole("link", { name: "Na domačo stran" })).toHaveAttribute("href", "/");
  const reference = new URL(page.url()).pathname.split("/").at(-1)!;
  const instructions = page.getByRole("region", { name: "Podatki za bančno nakazilo" });
  await expect(instructions).toHaveCount(0);
  expect(await page.content()).not.toContain(fixture.bank.iban);
  await expect(page.getByText(/Bančne podatke, točen znesek in referenco za nakazilo prejmete v samodejnem e-sporočilu/)).toBeVisible();
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

async function assertAccountingDetails(adminPage: Page, clients: LocalClients, order: OrderRow) {
  const saved = await oneRow(clients, "orders", "id", order.id);
  const item = await oneRow(clients, "order_items", "order_id", order.id);
  const product = item.product_snapshot as DatabaseRow;
  const shipping = saved.shipping_tax_snapshot as DatabaseRow;
  expect(product).toMatchObject({ vatRate: expect.any(Number), lineTotalCents: expect.any(Number), discountCents: expect.any(Number), discountedLineTotalCents: expect.any(Number) });
  expect(shipping).toMatchObject({ version: 1, shippingGrossCents: saved.shipping_cents, shippingTaxCents: saved.shipping_tax_cents, shippingNetCents: expect.any(Number) });

  const money = (value: unknown) => new Intl.NumberFormat("sl-SI", { style: "currency", currency: "EUR" }).format(Number(value) / 100);
  const rate = `${new Intl.NumberFormat("sl-SI").format(Number(product.vatRate))} %`;
  const accounting = adminPage.getByRole("region", { name: "Podatki za zunanjo pripravo računa", exact: true });
  await expect(accounting).toBeVisible();
  const itemCard = accounting.locator("section").filter({ has: adminPage.getByRole("heading", { name: String(item.product_name), exact: true }) });
  const shippingCard = accounting.locator("section").filter({ has: adminPage.getByRole("heading", { name: "Dostava", exact: true }) });
  const valueFor = (card: Locator, label: string) => card.locator("dl").first().locator("div").filter({ has: adminPage.getByText(label, { exact: true }) }).locator("dd");
  await expect(valueFor(itemCard, "Stopnja DDV")).toHaveText(rate);
  await expect(valueFor(itemCard, "Z DDV pred popustom")).toHaveText(money(product.lineTotalCents));
  await expect(valueFor(itemCard, "Popust")).toHaveText(money(product.discountCents));
  await expect(valueFor(itemCard, "Z DDV po popustu")).toHaveText(money(product.discountedLineTotalCents));
  await expect(valueFor(itemCard, "Vključen DDV")).toHaveText(money(item.tax_cents));
  await expect(valueFor(itemCard, "Znesek brez DDV")).toHaveText(money(Number(product.discountedLineTotalCents) - Number(item.tax_cents)));
  await expect(valueFor(shippingCard, "Znesek z DDV")).toHaveText(money(shipping.shippingGrossCents));
  await expect(valueFor(shippingCard, "Vključen DDV")).toHaveText(money(saved.shipping_tax_cents));
  await expect(valueFor(shippingCard, "Znesek brez DDV")).toHaveText(money(shipping.shippingNetCents));

  // The existing fixture is one VAT rate. Assert the rendered aggregate uses
  // saved line and shipping amounts, including VAT exactly once.
  const grouped = accounting.getByRole("region", { name: `Stopnja DDV ${rate}`, exact: true });
  await expect(grouped).toBeVisible();
  await expect(valueFor(grouped, "Znesek brez DDV")).toHaveText(money(Number(saved.total_cents) - Number(saved.tax_cents)));
  await expect(valueFor(grouped, "Vključen DDV")).toHaveText(money(saved.tax_cents));
  await expect(valueFor(grouped, "Znesek z DDV")).toHaveText(money(saved.total_cents));
  await expect(accounting.getByText("Ni izračunano / shranjeni razrez ni na voljo", { exact: true })).toHaveCount(0);
  return adminPage.locator(`#order-${order.id}`);
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
      await adminPage.goto(`/admin/narocila?order=${second.id}`);
      const proofForm = adminPage.locator('form.admin-transfer-proof');
      await proofForm.locator('input[name="proofReference"]').fill('E2E-LOCAL-PROOF-B');
      await proofForm.locator('input[name="proofReceived"]').check();
      await proofForm.getByRole('button', { name: 'Potrdi prejem in naročilo', exact: true }).click();
      await expect.poll(async () => (await oneRow(clients, 'orders', 'id', second.id)).transfer_proof_reference).toBe('E2E-LOCAL-PROOF-B');
      expect(await oneRow(clients, 'payments', 'order_id', second.id)).toMatchObject({ status: 'pending', paid_at: null });
      await page.goto(`/narocilo/${second.reference}`);
      await expect(page.locator('.order-success-hero .section-kicker')).toHaveText('Naročilo dokončno potrjeno');
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
      const accountingDetail = await assertAccountingDetails(adminPage, clients, second);
      const accountingImage = testInfo.outputPath("admin-accounting.png");
      await accountingDetail.screenshot({ path: accountingImage });
      await testInfo.attach("admin-accounting", { path: accountingImage, contentType: "image/png" });
      await adminPage.goto(`/admin/narocila?order=${first.id}`);
      const trashForm = adminPage.locator('form.admin-order-trash');
      await trashForm.locator('input[name="confirmed"]').check();
      await trashForm.getByRole('button', { name: 'Premakni v koš', exact: true }).click();
      await expect.poll(async () => (await oneRow(clients, 'orders', 'id', first.id)).deleted_at).not.toBeNull();
      await adminPage.goto(`/admin/narocila?order=${first.id}`);
      await trashForm.locator('input[name="confirmed"]').check();
      await trashForm.getByRole('button', { name: 'Obnovi', exact: true }).click();
      await expect.poll(async () => (await oneRow(clients, 'orders', 'id', first.id)).deleted_at).toBeNull();
      expect(await stock(clients)).toBe(2);

      const mailFixtures = Array.from({length:105}, (_,index) => ({
        mailbox:'kontakt@bistrava.com',uid_validity:'e2e-paging',imap_uid:index+1,
        sender_name:'Pagination fixture',sender_address:'fixture@example.test',
        subject:`E2E mailbox ${String(index).padStart(3,'0')}`,body_text:'Synthetic local mail',
        received_at:new Date(Date.UTC(2026,9,28,0,0,index)).toISOString(),
      }));
      const seededMail = await clients.privileged.from('mailbox_messages').insert(mailFixtures);
      expect(seededMail.error).toBeNull();
      await adminPage.goto('/admin/e-posta');
      const mailList = adminPage.locator('.mailbox-scroll');
      await expect(mailList.locator('button[aria-pressed]')).toHaveCount(50);
      const older = mailList.locator('.mailbox-load-more');
      await older.click();
      await expect(mailList.locator('button[aria-pressed]')).toHaveCount(100);
      await older.click();
      await expect(mailList.locator('button[aria-pressed]')).toHaveCount(105);
      await expect(older).toHaveCount(0);
      const oldest = mailList.getByRole('button', {name:/E2E mailbox 000/});
      await expect(oldest).toHaveClass(/is-unread/);
      await oldest.click();
      await expect(adminPage.locator('.mailbox-detail h2')).toHaveText('E2E mailbox 000');
      await expect(oldest).not.toHaveClass(/is-unread/);
      await adminPage.locator('.mailbox-list input[type="search"]').fill('E2E mailbox 000');
      await expect(mailList.locator('button[aria-pressed]')).toHaveCount(1);
      await expect(oldest).not.toHaveClass(/is-unread/);
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
