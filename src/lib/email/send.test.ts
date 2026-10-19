import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), previous: vi.fn(), send: vi.fn(), close: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/email/mailbox', () => ({
  mailboxAddress: 'kontakt@bistrava.com', mailboxConfigured: () => true,
  smtpTransport: () => ({ sendMail: mocks.send, close: mocks.close }),
}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => ({
  insert: mocks.insert,
  update: (value: unknown) => ({ eq: async () => mocks.update(value) }),
  select: () => ({ eq: () => ({ maybeSingle: mocks.previous }) }),
}) }) }));
import { sendOrderConfirmation } from './send';
import { renderToStaticMarkup } from 'react-dom/server';
import OrderConfirmationEmail from '@/emails/order-confirmation';
import { orderConfirmationEmailSchema } from '@/lib/validation/email';

const input = {
  to: 'customer@example.com', idempotencyKey: 'order-confirmation:test',
  data: { customerName: 'Example Customer', orderReference: 'BIS-TEST-123', orderUrl: 'https://bistrava.com/narocilo/BIS-TEST-123',
    totalCents: 1450, items: [{ name: 'Example filter', quantity: 1, lineTotalCents: 1000 }],
    bankTransfer: { beneficiary: 'EXAMPLE TEST ONLY', iban: 'GB82WEST12345698765432', bankName: 'Example Bank', bic: 'DEUTDEFF', currency: 'EUR' },
  },
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.insert.mockResolvedValue({ error: null });
  mocks.send.mockResolvedValue({ accepted: ['customer@example.com'] });
});
it('includes the saved account, exact total and reference without claiming payment receipt', async () => {
  expect((await sendOrderConfirmation(input)).ok).toBe(true);
  const mail = mocks.send.mock.calls[0][0];
  expect(mail.to).toBe(input.to);
  for (const value of ['EXAMPLE TEST ONLY', 'GB82WEST12345698765432', 'Example Bank', 'DEUTDEFF', '14,50', 'BIS-TEST-123', 'Plačilo še ni prejeto']) expect(mail.text).toContain(value);
  expect(mail.replyTo).toBe('kontakt@bistrava.com');
  expect(mail.text).toContain('priložite potrdilo o nakazilu');
  expect(mail.text).toContain('dokončno potrjeno ob prejemu potrdila o nakazilu');
  expect(mail.text).toContain('Prejem sredstev preverimo ločeno');
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent' }));
  expect(mocks.close).toHaveBeenCalledOnce();
});
it('includes the proof and final confirmation instructions in the HTML fallback too', () => {
  const html = renderToStaticMarkup(OrderConfirmationEmail(orderConfirmationEmailSchema.parse(input.data)));
  for (const value of ['GB82WEST12345698765432', 'BIS-TEST-123', 'priložite potrdilo o nakazilu', 'dokončno potrjeno ob prejemu potrdila o nakazilu']) expect(html).toContain(value);
});
it('does not duplicate or retry an ambiguous previous SMTP delivery', async () => {
  mocks.insert.mockResolvedValue({ error: { code: '23505' } });
  for (const status of ['queued', 'failed', 'sent']) {
    mocks.previous.mockResolvedValue({ data: { status, provider_message_id: '<existing@bistrava.com>' } });
    expect((await sendOrderConfirmation(input)).ok).toBe(status === 'sent');
  }
  expect(mocks.send).not.toHaveBeenCalled();
});
it('records SMTP failure without throwing away the order', async () => {
  mocks.send.mockRejectedValue(new Error('connection interrupted'));
  expect((await sendOrderConfirmation(input)).ok).toBe(false);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed', error_code: 'smtp_delivery_unconfirmed' }));
  expect(mocks.close).toHaveBeenCalledOnce();
});
