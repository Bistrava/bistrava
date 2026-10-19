import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ token: vi.fn(), client: vi.fn(), select: vi.fn(), eq: vi.fn(), row: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.token }) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.client }));
import { getGuestOrder, hashGuestOrderToken } from './guest-orders';

beforeEach(() => {
  vi.resetAllMocks();
  const query = { select: mocks.select, eq: mocks.eq, maybeSingle: mocks.row };
  mocks.select.mockReturnValue(query);
  mocks.eq.mockReturnValue(query);
  mocks.client.mockReturnValue({ from: () => query });
  mocks.token.mockReturnValue({ value: 'private-browser-token' });
  mocks.row.mockResolvedValue({ error: null, data: {
    reference: 'BIS-TEST-123', status: 'awaiting_payment', email: 'customer@example.test',
    checkout_mode: 'bank_transfer', transfer_proof_received_at: '2026-10-19T12:00:00Z',
    subtotal_cents: 1000, discount_cents: 0, shipping_cents: 0, total_cents: 1000,
    shipping_address_snapshot: {}, order_items: [], created_at: '2026-10-19T10:00:00Z',
  } });
});

it('reads only the payment method and proof timestamp for the private customer page', async () => {
  const order = await getGuestOrder('BIS-TEST-123');
  expect(order).toMatchObject({ bankTransfer: true, transferProofReceivedAt: '2026-10-19T12:00:00Z' });
  const selected = mocks.select.mock.calls[0][0];
  expect(selected).not.toContain('bank_transfer_snapshot');
  expect(selected).not.toContain('transfer_proof_reference');
  expect(mocks.eq).toHaveBeenCalledWith('guest_access_token_hash', hashGuestOrderToken('private-browser-token'));
});

it('does not access orders without the private browser token', async () => {
  mocks.token.mockReturnValue(undefined);
  expect(await getGuestOrder('BIS-TEST-123')).toBeNull();
  expect(mocks.client).not.toHaveBeenCalled();
});

it('does not disclose an order when the token does not match', async () => {
  mocks.row.mockResolvedValue({ error: null, data: null });
  expect(await getGuestOrder('BIS-TEST-123')).toBeNull();
});
