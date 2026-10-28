import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ quote: vi.fn(), send: vi.fn(), config: vi.fn(), card: vi.fn() }));
vi.mock('@/actions/checkout', () => ({ quoteCheckout: mocks.quote }));
vi.mock('@/lib/email/send', () => ({ sendCardAttemptNotification: mocks.send }));
vi.mock('@/lib/commerce/config', () => ({ getCheckoutConfig: mocks.config, getCardPaymentConfig: mocks.card }));
import { notifyCardAttempt } from './card-attempt';
import { cardUnavailableMessage } from '@/lib/payments/card-unavailable';

function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    email: 'maja@example.com', phone: '+38640111222', firstName: 'Maja', lastName: 'Novak',
    addressLine1: 'Slovenska cesta 1', postalCode: '1000', city: 'Ljubljana', countryCode: 'SI',
    shippingRateId: '10000000-0000-4000-8000-000000000001', termsAccepted: 'on',
    idempotencyKey: '20000000-0000-4000-8000-000000000001', guestToken: 'a'.repeat(64),
    expectedTotalCents: '1', cart: JSON.stringify([{ sku: 'BIS-030', quantity: 2 }]),
  })) data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.config.mockResolvedValue({ enabled: true });
  mocks.card.mockReturnValue(null);
  mocks.quote.mockResolvedValue({ status: 'success', quote: { subtotalCents: 1000, shippingCents: 450, discountCents: 0, totalCents: 1450 } });
  mocks.send.mockResolvedValue({ ok: true });
});
it('notifies with the validated cart and server totals, never returning an order or payment session', async () => {
  const data = form();
  data.set('cardNumber', 'SHOULD-NOT-PASS');
  data.set('cvc', 'SHOULD-NOT-PASS');
  const result = await notifyCardAttempt(data);
  expect(result).toEqual({ status: 'error', message: cardUnavailableMessage });
  expect(mocks.send).toHaveBeenCalledOnce();
  expect(mocks.send.mock.calls[0][0].quote.totalCents).toBe(1450);
  expect(JSON.stringify(mocks.send.mock.calls)).not.toContain('SHOULD-NOT-PASS');
});
it('does not send for invalid contacts or a filled honeypot', async () => {
  for (const [key, value] of [['email', 'invalid'], ['website', 'bot']]) {
    const data = form(); data.set(key, value);
    expect((await notifyCardAttempt(data)).fieldErrors).toBeDefined();
  }
  expect(mocks.send).not.toHaveBeenCalled();
});
it('does not send when ordering is closed or live card checkout is configured', async () => {
  mocks.config.mockResolvedValue({ enabled: false });
  await notifyCardAttempt(form());
  mocks.config.mockResolvedValue({ enabled: true });
  mocks.card.mockReturnValue({ publishableKey: 'configured' });
  await notifyCardAttempt(form());
  expect(mocks.quote).not.toHaveBeenCalled();
  expect(mocks.send).not.toHaveBeenCalled();
});
it('does not send when the rate-limited quote fails', async () => {
  mocks.quote.mockResolvedValue({ status: 'error', message: 'rate limited' });
  expect((await notifyCardAttempt(form())).message).toBe(cardUnavailableMessage);
  expect(mocks.send).not.toHaveBeenCalled();
});
it('still directs the customer to transfer when delivery fails', async () => {
  mocks.send.mockRejectedValue(new Error('smtp unavailable'));
  expect((await notifyCardAttempt(form())).message).toBe(cardUnavailableMessage);
});
