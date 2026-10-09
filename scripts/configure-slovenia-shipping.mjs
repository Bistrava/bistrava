// Configure the approved Slovenian tariffs through the audited administrator RPCs.
// Dry-run by default. Run with --apply after migration 202610090017.
// No emails are sent and checkout activation is not changed.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile('.env.local');
const apply = process.argv.includes('--apply');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname, 'hdgmstfqgybxdwmdsard.supabase.co', 'Unexpected Supabase project');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(url, process.env.SUPABASE_SECRET_KEY, options);
const session = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const definitions = [
  { name: 'Standardna dostava', price_cents: 450, min_order_cents: null, max_order_cents: 8000 },
  { name: 'Brezplačna dostava', price_cents: 0, min_order_cents: 8001, max_order_cents: null },
];

async function read(client) {
  const [zones, rates] = await Promise.all([
    client.from('shipping_zones').select('id,name,country_codes,postal_code_patterns,active,updated_at'),
    client.from('shipping_rates').select('id,zone_id,name,currency,price_cents,min_order_cents,max_order_cents,estimated_days_min,estimated_days_max,active,updated_at'),
  ]);
  if (zones.error) throw new Error(zones.error.message);
  if (rates.error) throw new Error(rates.error.message);
  return { zones: zones.data, rates: rates.data };
}
async function rpc(name, values) {
  const result = await session.rpc(name, values);
  if (result.error) throw new Error(`${name}: ${result.error.message}`);
  return result.data;
}
const before = await read(service);
// Refuse to overwrite another delivery configuration or matching names in another country.
assert.ok(before.zones.length <= 1, 'Additional shipping zones require review');
assert.ok(before.zones.every(z => z.name === 'Slovenija' && JSON.stringify(z.country_codes) === '["SI"]' && (z.postal_code_patterns?.length ?? 0) === 0), 'Existing zone differs from nationwide Slovenia');
assert.ok(before.rates.length <= 2 && before.rates.every(r => r.zone_id === before.zones[0]?.id && r.currency === 'EUR' && definitions.some(d => d.name === r.name)), 'Existing tariffs require review');
assert.equal(new Set(before.rates.map(r => r.name)).size, before.rates.length, 'Duplicate shipping tariffs');
console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', current: before, proposed: definitions, thresholdBasis: 'products gross subtotal before coupon reductions', estimatedDeliveryDays: null }, null, 2));
if (apply) {
await mkdir('tmp/shipping-verification', { recursive: true });
await writeFile(`tmp/shipping-verification/before-${Date.now()}.json`, JSON.stringify(before, null, 2));
try {
  const roles = await service.from('admin_roles').select('profile_id').eq('role', 'admin').eq('active', true);
  if (roles.error) throw new Error(roles.error.message);
  let adminEmail;
  for (const role of roles.data) {
    const account = await service.auth.admin.getUserById(role.profile_id);
    if (account.data.user?.email === 'azauto851@gmail.com') adminEmail = account.data.user.email;
  }
  assert.ok(adminEmail, 'Authorized administrator not found');
  const link = await service.auth.admin.generateLink({ type: 'magiclink', email: adminEmail });
  if (link.error) throw new Error(link.error.message);
  const verified = await session.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'magiclink' });
  if (verified.error) throw new Error(verified.error.message);

  const oldZone = before.zones[0];
  const zoneId = oldZone?.active ? oldZone.id : await rpc('admin_save_shipping_zone', {
    input_id: oldZone?.id ?? null, input_name: 'Slovenija', input_active: true, input_expected_updated_at: oldZone?.updated_at ?? null,
  });
  assert.equal(typeof zoneId, 'string');
  for (const definition of definitions) {
    const previous = before.rates.find(r => r.name === definition.name);
    const unchanged = previous && previous.active && Object.entries(definition).every(([key, value]) => previous[key] === value);
    if (unchanged) continue;
    await rpc('admin_save_shipping_rate', {
      input_id: previous?.id ?? null, input_zone_id: zoneId, input_name: definition.name,
      input_price_cents: definition.price_cents, input_days_min: previous?.estimated_days_min ?? null,
      input_days_max: previous?.estimated_days_max ?? null, input_active: true,
      input_expected_updated_at: previous?.updated_at ?? null,
      input_min_order_cents: definition.min_order_cents, input_max_order_cents: definition.max_order_cents,
    });
  }
  const after = await read(service);
  assert.equal(after.zones.length, 1);
  assert.equal(after.rates.length, 2);
  for (const definition of definitions) {
    const actual = after.rates.find(r => r.name === definition.name);
    assert.ok(actual?.active);
    for (const [key, value] of Object.entries(definition)) assert.equal(actual[key], value);
  }
  const publicClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const publiclyVisible = await read(publicClient);
  assert.equal(publiclyVisible.rates.length, 2, 'Public shipping policy must match configured rates');
  await writeFile('tmp/shipping-verification/configured.json', JSON.stringify(after, null, 2));
  console.log('Configured: Slovenia only; 4.50 EUR up to 80.00 EUR inclusive, free from 80.01 EUR. Checkout unchanged.');
} finally {
  await session.auth.signOut({ scope: 'local' });
}
}
