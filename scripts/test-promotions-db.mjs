// Isolated PostgreSQL (WASM), no network, environment secrets or production data.
// Install once: npm install --prefix tmp/promotion-sql-test --no-save --package-lock=false --ignore-scripts @electric-sql/pglite
// Run: node scripts/test-promotions-db.mjs
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "../tmp/promotion-sql-test/node_modules/@electric-sql/pglite/dist/index.js";

const db = new PGlite();
let checks = 0;
let stage = "initialization";
const scalar = async (sql, args = []) => Object.values((await db.query(sql, args)).rows[0])[0];
const check = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
async function rejects(sql, args, message) {
  await assert.rejects(db.query(sql, args), (error) => error.message.includes(message)); checks++;
}
const admin = "10000000-0000-4000-8000-000000000001";
const editor = "10000000-0000-4000-8000-000000000002";
const customer = "10000000-0000-4000-8000-000000000003";
const inquiry = "10000000-0000-4000-8000-000000000004";
const rate = "20000000-0000-4000-8000-000000000001";
const key = "30000000-0000-4000-8000-000000000001";
const secondKey = "30000000-0000-4000-8000-000000000002";
const cart = [{ sku: "TEST-01", quantity: 1 }, { sku: "TEST-02", quantity: 1 }];
const body = { id: null, code_id: null, expected_updated_at: null, name: "Local isolated test", description: null,
  discount_type: "percentage", value: 10, code: "LOCAL10", active: true, code_active: true,
  starts_at: null, ends_at: null, minimum_order_cents: null, usage_limit: 1, code_usage_limit: 1 };
const orderSql = "select * from public.create_pending_guest_order($1::jsonb,'local@example.test','+38640000000','{\"firstName\":\"Local\",\"lastName\":\"Test\"}'::jsonb,'{\"countryCode\":\"SI\",\"postalCode\":\"1000\"}'::jsonb,$2::uuid,'',$3,$4::uuid,$5,$6::int)";
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.extension(text) returns text language sql as $$select regexp_replace($1,'^.*[.]','')$$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;`);
  const migrations = (await readdir(new URL("../supabase/migrations/", import.meta.url))).filter((filename) => filename.endsWith(".sql")).sort();
  for (const filename of migrations) {
    stage = filename;
    const sql = (await readFile(new URL(`../supabase/migrations/${filename}`, import.meta.url), "utf8")).replace("create extension if not exists pgcrypto;", "");
    await db.exec(sql);
  }
  stage = "promotion, checkout, customer and guide scenarios";
  await db.query("insert into auth.users(id,email) values($1,'admin@example.test'),($2,'editor@example.test')", [admin, editor]);
  await db.query("insert into public.admin_roles(profile_id,role) values($1,'admin'),($2,'editor')", [admin, editor]);
  await db.exec(`insert into public.products(name,name_sl,slug,brand,short_description,status,published_at,sku,price_cents,sales_mode,stock_status,stock_quantity) values
    ('Local 1','Local 1','local-1','Local','Only in memory','active',now(),'TEST-01',101,'buy_now','in_stock',15),
    ('Local 2','Local 2','local-2','Local','Only in memory','active',now(),'TEST-02',202,'buy_now','in_stock',15);
    insert into public.shipping_zones(id,name,country_codes) values('20000000-0000-4000-8000-000000000002','Local',array['SI']);
    insert into public.shipping_rates(id,zone_id,name,price_cents) values('${rate}','20000000-0000-4000-8000-000000000002','Local',500);
    insert into public.categories(name,slug,status,published_at) values('Local','local','active',now());`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [editor]);
  await db.exec("set role authenticated");
  await rejects("select public.save_admin_promotion($1)", [body], "admin_required");
  await rejects("insert into public.discounts(name,discount_type,value) values('Forbidden','fixed',1)", [], "permission denied");
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
  await db.exec("set role authenticated");
  const campaign = await scalar("select public.save_admin_promotion($1)", [body]); checks++;
  await rejects("select public.save_admin_promotion($1)", [{ ...body, value: 101, code: "INVALID101" }], "invalid_promotion");
  await rejects("select public.save_admin_promotion($1)", [{ ...body, starts_at: "2030-01-01T00:00:00Z", ends_at: "2029-01-01T00:00:00Z", code: "INVALIDTIME" }], "invalid_promotion");
  await rejects("select public.save_admin_promotion($1)", [body], "duplicate key");
  await rejects("select public.quote_guest_checkout($1,$2,$3)", [cart, rate, "LOCAL10"], "permission denied");
  await db.exec("reset role; set role anon");
  await rejects("select public.quote_guest_checkout($1,$2,$3)", [cart, rate, "LOCAL10"], "permission denied");
  await db.exec("reset role; set role service_role");
  const quote = await scalar("select public.quote_guest_checkout($1,$2,$3)", [cart, rate, " local10 "]);
  check(quote, { subtotalCents: 303, shippingCents: 500, discountCents: 30, totalCents: 773, code: "LOCAL10" });
  await rejects("select public.calculate_guest_checkout_quote($1,$2,$3,true)", [cart, rate, "LOCAL10"], "permission denied");
  await rejects(orderSql, [cart, rate, "a".repeat(64), key, "LOCAL10", 774], "checkout_total_changed");
  const order = (await db.query(orderSql, [cart, rate, "a".repeat(64), key, "LOCAL10", 773])).rows[0];
  check((await db.query(orderSql, [cart, rate, "a".repeat(64), key, "LOCAL10", 773])).rows[0], order);
  await rejects(orderSql, [cart, rate, "b".repeat(64), key, "LOCAL10", 773], "idempotency_conflict");
  await rejects(orderSql, [cart, rate, "b".repeat(64), secondKey, "LOCAL10", 773], "discount_unavailable");
  await db.exec("reset role");
  check(await scalar("select count(*)::int from public.orders"), 1);
  check(await scalar("select used_count from public.discounts where id=$1", [campaign]), 1);
  check(await scalar("select min(stock_quantity) from public.products"), 14);
  check((await db.query("select discount_cents,total_cents,tax_cents from public.orders where id=$1", [order.order_id])).rows[0], { discount_cents: 30, total_cents: 773, tax_cents: 49 });
  check(await scalar("select sum((product_snapshot->>'discountCents')::int)::int from public.order_items"), 30);
  check(await scalar("select amount_cents from public.payments where order_id=$1", [order.order_id]), 773);
  const updatedAt = await scalar("select updated_at::text from public.discounts where id=$1", [campaign]);
  const codeId = await scalar("select id from public.discount_codes where discount_id=$1", [campaign]);
  await db.exec("set role authenticated");
  await rejects("select public.save_admin_promotion($1)", [{ ...body, id: campaign, code_id: codeId, expected_updated_at: updatedAt, usage_limit: 0 }], "usage_limit_below_used");
  await rejects("select public.save_admin_promotion($1)", [{ ...body, id: campaign, code_id: codeId, expected_updated_at: "2000-01-01T00:00:00Z" }], "promotion_conflict");
  const orderTime = await scalar("select updated_at::text from public.orders where id=$1", [order.order_id]);
  await db.query("select public.admin_save_order($1,$2,'cancelled','',null,null)", [order.order_id, orderTime]);
  await db.exec("reset role");
  check(await scalar("select used_count from public.discounts where id=$1", [campaign]), 0);
  check(await scalar("select used_count from public.discount_codes where id=$1", [codeId]), 0);
  check(await scalar("select min(stock_quantity) from public.products"), 15);
  check(await scalar("select discount_released_at is not null from public.orders where id=$1", [order.order_id]), true);
  await db.query("update public.orders set status='cancelled' where id=$1", [order.order_id]);
  check(await scalar("select used_count from public.discounts where id=$1", [campaign]), 0);
  await db.query("update public.discounts set discount_type='fixed',value=10000 where id=$1", [campaign]);
  check((await scalar("select public.quote_guest_checkout($1,$2,$3)", [cart, rate, "LOCAL10"])).totalCents, 500);
  await db.query("update public.discounts set minimum_order_cents=304 where id=$1", [campaign]);
  await rejects("select public.quote_guest_checkout($1,$2,$3)", [cart, rate, "LOCAL10"], "discount_unavailable");
  await db.query("update public.discounts set minimum_order_cents=null,ends_at=now() where id=$1", [campaign]);
  await rejects("select public.quote_guest_checkout($1,$2,$3)", [cart, rate, "LOCAL10"], "discount_unavailable");
  await db.query("update public.discounts set ends_at=null,starts_at=now()+interval '1 hour' where id=$1", [campaign]);
  await rejects("select public.quote_guest_checkout($1,$2,$3)", [cart, rate, "LOCAL10"], "discount_unavailable");

  // Non-promotional orders have exactly the same displayed-total protection.
  await rejects(orderSql, [cart, rate, "b".repeat(64), secondKey, null, 802], "checkout_total_changed");
  const fullPriceOrder = (await db.query(orderSql, [cart, rate, "b".repeat(64), secondKey, null, 803])).rows[0];
  check(await scalar("select discount_cents from public.orders where id=$1", [fullPriceOrder.order_id]), 0);
  check(await scalar("select stock_quantity from public.products where sku='TEST-01'"), 14);
  await db.query("update public.payments set status='paid',paid_at=now() where order_id=$1", [fullPriceOrder.order_id]);
  await db.query("update public.orders set status='paid' where id=$1", [fullPriceOrder.order_id]);
  await db.query("insert into auth.users(id,email) values($1,'customer@example.test')", [customer]);
  await db.query("insert into public.quote_requests(id,request_type,name,email,message,consent_version,consented_at,ip_hash) values($1,'contact','Local Inquiry','local@example.test','Local test question only','local',now(),repeat('a',64))", [inquiry]);
  const customerVersion = await scalar("select updated_at::text from public.profiles where id=$1", [customer]);
  const inquiryVersion = await scalar("select updated_at::text from public.quote_requests where id=$1", [inquiry]);
  await db.exec("set role authenticated");
  const overview = await scalar("select public.get_admin_overview()");
  check(overview.products, 2); check(overview.stockUnits, 28); check(overview.orders30, 2); check(overview.openOrders, 1);
  check(overview.revenue30, 803); check(overview.customers, 2);
  check(overview.monthlySales.at(-1).cents, 803); check(overview.recentOrders.length, 2);
  await db.query("select public.save_admin_customer($1,$2,' Updated Customer ','+38640000000','fr-FR')", [customer, customerVersion]);
  check((await db.query("select full_name,locale from public.profiles where id=$1", [customer])).rows[0], { full_name: "Updated Customer", locale: "fr-FR" });
  await rejects("select public.save_admin_customer($1,$2,'Stale name','','sl-SI')", [customer, customerVersion], "customer_conflict");
  await rejects("select public.save_admin_customer($1,$2,'Staff name','','sl-SI')", [editor, customerVersion], "staff_account");
  await db.query("select public.save_admin_inquiry($1,$2,'responded','Reviewed locally')", [inquiry, inquiryVersion]);
  check((await db.query("select status,assigned_to,responded_at is not null as responded from public.quote_requests where id=$1", [inquiry])).rows[0], { status: "responded", assigned_to: admin, responded: true });
  await rejects("select public.save_admin_inquiry($1,$2,'closed','Stale edit')", [inquiry, inquiryVersion], "inquiry_conflict");

  // Catalogue stock guard and editor mutation rejection on all new sections.
  await db.query("select public.adjust_admin_inventory('local-1',14,4,'in_stock','Local count test')");
  check(await scalar("select stock_quantity from public.products where sku='TEST-01'"), 4);
  await rejects("select public.adjust_admin_inventory('local-1',14,3,'in_stock','Stale local test')", [], "stale_product");
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [editor]);
  await db.exec("set role authenticated");
  check((await scalar("select public.get_admin_overview()")).lowStockCount, 1);
  await rejects("select public.adjust_admin_inventory('local-1',4,3,'in_stock','Local editor test')", [], "admin_required");
  await rejects("select public.adjust_inventory('99999999-0000-4000-8000-000000000001',1,'correction','Legacy editor attempt',null,null)", [], "admin_required");
  await rejects("select public.save_admin_product('', '{}'::jsonb,'local',null)", [], "admin_required");
  await rejects("select public.save_admin_customer($1,$2,'Editor changed','','sl-SI')", [customer, customerVersion], "admin_required");
  await rejects("select public.save_admin_inquiry($1,$2,'closed','Editor changed')", [inquiry, inquiryVersion], "admin_required");
  await rejects("select public.admin_save_order($1,now(),'paid','',null,null)", [fullPriceOrder.order_id], "admin_required");
  check((await db.query("update public.products set stock_quantity=999 where sku='TEST-01' returning sku")).rows.length, 0);
  check((await db.query("update public.orders set total_cents=0 where id=$1 returning id", [fullPriceOrder.order_id])).rows.length, 0);
  check((await db.query("update public.quote_requests set status='closed' where id=$1 returning id", [inquiry])).rows.length, 0);
  await db.exec("reset role; set role anon");
  await rejects("select public.get_admin_overview()", [], "permission denied");
  await rejects("select public.save_admin_customer($1,$2,'Anon','','sl-SI')", [customer, customerVersion], "permission denied");
  await rejects("select public.save_admin_inquiry($1,$2,'closed','Anon')", [inquiry, inquiryVersion], "permission denied");
  await db.exec("reset role");

  if (migrations.some((name) => name.startsWith("202610080016"))) {
    const guideSql = "select public.save_admin_guide($1,$2,$3,$4,$5,$6,$7,$8,$9)";
    const guide = [null, null, "Local guide", "local-guide", "Local guide excerpt for tests", { sections: [{ title: "Local section", paragraphs: ["Only in ephemeral PostgreSQL."] }] }, "draft", "Local guide title", "Local guide description"];
    await db.exec("set role authenticated");
    await rejects(guideSql, guide, "admin_required");
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
    await db.exec("set role authenticated");
    const guideId = await scalar(guideSql, guide);
    check(await scalar("select status from public.guides where id=$1", [guideId]), "draft");
    const guideVersion = await scalar("select updated_at::text from public.guides where id=$1", [guideId]);
    await scalar(guideSql, [guideId, guideVersion, ...guide.slice(2, 6), "published", ...guide.slice(7)]);
    check(await scalar("select published_at is not null from public.guides where id=$1", [guideId]), true);
    await rejects(guideSql, [guideId, guideVersion, ...guide.slice(2)], "guide_conflict");
    const newGuideVersion = await scalar("select updated_at::text from public.guides where id=$1", [guideId]);
    const renamedGuide = [guideId, newGuideVersion, ...guide.slice(2)]; renamedGuide[3] = "different-guide";
    await rejects(guideSql, renamedGuide, "guide_slug_is_stable");
    const badGuide = [...guide]; badGuide[5] = { sections: [] };
    await rejects(guideSql, badGuide, "invalid_guide");
    await db.exec("reset role; set role anon");
    check(await scalar("select count(*)::int from public.guides where id=$1", [guideId]), 1);
    await rejects(guideSql, guide, "permission denied");
    await db.exec("reset role");
    await db.exec("set role authenticated");
    const archiveVersion = await scalar("select updated_at::text from public.guides where id=$1", [guideId]);
    await scalar(guideSql, [guideId, archiveVersion, ...guide.slice(2, 6), "archived", ...guide.slice(7)]);
    await db.exec("reset role; set role anon");
    check(await scalar("select count(*)::int from public.guides where id=$1", [guideId]), 0);
    await db.exec("reset role");
  }
  stage = "product agent rollback suite";
  await db.exec(await readFile(new URL("../supabase/tests/admin_products.sql", import.meta.url), "utf8")); checks++;
  check(await scalar("select count(*)::int from public.products"), 2);
  console.log(JSON.stringify({ status: "passed", checks, migrations: migrations.length, database: "ephemeral PGlite; no Supabase writes" }));
} catch (error) {
  console.error(JSON.stringify({ status: "failed", stage, checks, message: error.message, detail: error.detail, where: error.where }));
  process.exitCode = 1;
} finally { await db.close(); }
