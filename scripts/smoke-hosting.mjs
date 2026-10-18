import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";

const base = new URL(process.env.BISTRAVA_PREVIEW_URL || "http://127.0.0.1:3100");
assert(["http:", "https:"].includes(base.protocol) && !base.username && !base.password);
const request = (path, options = {}) => fetch(new URL(path, base), {
  signal: AbortSignal.timeout(10_000), redirect: "manual", ...options,
});
let ready = false;
for (let attempt = 0; attempt < 20 && !ready; attempt++) {
  try { ready = (await request("/health")).ok; } catch {}
  if (!ready) await setTimeout(1000);
}
assert(ready, "Server did not become healthy");
const health = await request("/health");
assert.deepEqual(await health.json(), { status: "ok" });
assert.equal(health.headers.get("cache-control"), "no-store");
const home = await request("/");
assert.equal(home.status, 200);
assert.match(await home.text(), /Bistrava/);
const contact = await request("/kontakt");
assert.equal(contact.status, 200);
assert.match(await contact.text(), /PUREH2O/);
const legal = await request("/pravna-obvestila");
assert.equal(legal.status, 200);
assert.match(await legal.text(), /Erika Kozjan/);
const image = await request("/_next/image?url=%2Fbrand%2Fbistrava-logo-web.png&w=640&q=75");
assert.equal(image.status, 200, "Standalone image optimizer must work");
assert.match(image.headers.get("content-type") || "", /^image\//);
assert((await image.arrayBuffer()).byteLength > 0);
if (process.env.BISTRAVA_EXPECT_NOINDEX === "true") {
  assert.match(home.headers.get("x-robots-tag") || "", /noindex/);
  const robots = await request("/robots.txt");
  assert.match(await robots.text(), /Disallow: \/\s/);
}
// Foreign origin must be rejected before authorization or any IMAP/SMTP work.
const foreignMailbox = await request("/admin/mailbox", {
  method: "POST", headers: { Origin: "https://untrusted.invalid", "Content-Type": "application/json" },
  body: JSON.stringify({ action: "sync" }),
});
assert.equal(foreignMailbox.status, 403);
assert.deepEqual(await foreignMailbox.json(), { error: "origin" });
console.log("Hosting checks passed: health, storefront, seller, assets/images, indexing and mailbox origin guard. No orders or emails created.");
