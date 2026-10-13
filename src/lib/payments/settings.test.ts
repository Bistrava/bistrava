import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ access: vi.fn(), rpc: vi.fn(), single: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/admin', () => ({ getAdminAccess: mocks.access }));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({ rpc: mocks.rpc }) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ single: mocks.single }) }) }) }) }));
import { paymentSettingsSchema } from './settings';
import { saveAdminPaymentSettings } from '@/actions/admin-payments';
import { getCheckoutConfig } from '@/lib/commerce/config';
const bank = { beneficiary: 'EXAMPLE TEST ONLY', iban: 'GB82WEST12345698765432', bankName: 'Example bank', bic: '', currency: 'EUR' };
function form() { const data = new FormData(); for (const [key, value] of Object.entries({ ...bank, revision: '0', enabled: 'on' })) data.set(key, value); return data; }
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('CHECKOUT_ORDERING_ENABLED', 'true'); mocks.access.mockResolvedValue({ status: 'authorized', role: 'admin' }); mocks.rpc.mockResolvedValue({ data: 1 }); });
it('allows incomplete disabled drafts but requires a valid receiving account when enabled', () => {
  const draft = { revision: 0, enabled: false, beneficiary: '', bankName: '', iban: '', bic: '' };
  expect(paymentSettingsSchema.safeParse(draft).success).toBe(true);
  expect(paymentSettingsSchema.safeParse({ ...draft, enabled: true }).success).toBe(false);
  expect(paymentSettingsSchema.safeParse({ ...draft, ...bank, enabled: true }).success).toBe(true);
});
it('rejects unauthenticated users and editors before attempting a write', async () => {
  for (const access of [{ status: 'unauthenticated' }, { status: 'authorized', role: 'editor' }]) {
    mocks.access.mockResolvedValue(access);
    expect((await saveAdminPaymentSettings({ status: 'idle', message: '' }, form())).status).toBe('error');
  }
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it('saves normalized bank details with concurrency revision and no client-supplied actor', async () => {
  const input = form(); input.set('iban', 'gb82 west 1234 5698 7654 32'); input.set('actorId', 'attacker');
  expect((await saveAdminPaymentSettings({ status: 'idle', message: '' }, input)).revision).toBe(1);
  expect(mocks.rpc).toHaveBeenCalledWith('save_admin_payment_settings', { input_expected_revision: 0, input_enabled: true, input_bank_details: bank });
});
it('reports a concurrent update without claiming success', async () => {
  mocks.rpc.mockResolvedValue({ error: { message: 'payment_settings_conflict' } });
  expect((await saveAdminPaymentSettings({ status: 'idle', message: '' }, form())).message).toContain('Actualisez');
});
it('uses stored settings immediately and respects both the method switch and order-opening gate', async () => {
  mocks.single.mockResolvedValue({ data: { configured: true, enabled: true, bank_details: bank, revision: 3 } });
  expect(await getCheckoutConfig()).toMatchObject({ enabled: true, bankTransfer: bank, version: 'db:3' });
  vi.stubEnv('CHECKOUT_ORDERING_ENABLED', 'false');
  expect(await getCheckoutConfig()).toMatchObject({ enabled: false, bankTransfer: bank });
  mocks.single.mockResolvedValue({ data: { configured: true, enabled: false, bank_details: bank, revision: 4 } });
  expect(await getCheckoutConfig()).toMatchObject({ enabled: false, bankTransfer: null });
});
it('fails closed on database errors instead of showing an old account from environment variables', async () => {
  mocks.single.mockResolvedValue({ error: { message: 'unavailable' } });
  expect(await getCheckoutConfig()).toMatchObject({ enabled: false, bankTransfer: null });
});
