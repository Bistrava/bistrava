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
import { sendCardAttemptNotification, sendOrderConfirmation } from './send';
import { renderToStaticMarkup } from 'react-dom/server';
import OrderConfirmationEmail from '@/emails/order-confirmation';
import { orderConfirmationEmailSchema } from '@/lib/validation/email';
import { createTransport } from 'nodemailer';
import { simpleParser } from 'mailparser';

const input = {
  to: 'customer@example.com', idempotencyKey: 'order-confirmation:test',
  data: { customerName: 'Example Customer', orderReference: 'BIS-TEST-123', orderUrl: 'https://bistrava.com/narocilo/BIS-TEST-123',
    totalCents: 1450, items: [{ name: 'Example filter', quantity: 1, lineTotalCents: 1000 }],
    bankTransfer: { beneficiary: 'EXAMPLE TEST ONLY', iban: 'GB82WEST12345698765432', bankName: 'Example Bank', bic: 'DEUTDEFF', currency: 'EUR' },
  },
};
const attempt = {
  data: {
    email: 'maja@example.com', phone: '+38640111222', firstName: '<Maja>', lastName: 'Novak',
    addressLine1: 'Slovenska cesta 1', postalCode: '1000', city: 'Ljubljana', countryCode: 'SI',
    shippingRateId: '10000000-0000-4000-8000-000000000001', termsAccepted: 'on',
    idempotencyKey: '20000000-0000-4000-8000-000000000001', guestToken: 'PRIVATE_TOKEN'.repeat(4),
    expectedTotalCents: 1450, cart: [{ sku: 'BIS-030', quantity: 2 }], cardNumber: 'EXCLUDED_CARD_FIELD',
  },
  quote: { subtotalCents: 1000, shippingCents: 450, discountCents: 0, totalCents: 1450 },
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.insert.mockResolvedValue({ error: null });
  mocks.send.mockResolvedValue({ accepted: ['customer@example.com'] });
});
it('sends a clearly unpaid cart attempt only to the store, escaping text and excluding tokens and unknown fields', async () => {
  expect((await sendCardAttemptNotification(attempt)).ok).toBe(true);
  const mail = mocks.send.mock.calls[0][0];
  expect(mail.to).toBe('kontakt@bistrava.com');
  for (const value of ['maja@example.com', 'BIS-030', '14,50', 'Naročilo ni ustvarjeno']) expect(mail.text).toContain(value);
  expect(mail.html).toContain('&lt;Maja&gt;');
  expect(JSON.stringify(mail)).not.toContain('PRIVATE_TOKEN');
  expect(JSON.stringify(mail)).not.toContain('EXCLUDED_CARD_FIELD');
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ email_type: 'checkout_card_attempt', idempotency_key: `card-attempt:${attempt.data.idempotencyKey}` }));
});
it('does not send a second card-attempt notification for an already reserved submission', async () => {
  mocks.insert.mockResolvedValue({ error: { code: '23505' } });
  mocks.previous.mockResolvedValue({ data: { status: 'sent' } });
  await sendCardAttemptNotification(attempt);
  expect(mocks.send).not.toHaveBeenCalled();
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
  expect(mail.html).toContain('https://bistrava.com/brand/bistrava-logo-web.png');
  expect(mail.html).toContain('alt="Bistrava"');
  expect(mail.html).toContain('#10324A');
  expect(mail.html).toContain('#20B8A6');
  expect(mail.html).toContain('GB82 WEST 1234 5698 7654 32');
  expect(mail.html).toContain('dokončno potrjeno ob prejemu potrdila o nakazilu');
  expect(mail.html).toContain('mailto:kontakt@bistrava.com');
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent' }));
  expect(mocks.close).toHaveBeenCalledOnce();
});
it('includes the proof and final confirmation instructions in the HTML fallback too', () => {
  const html = renderToStaticMarkup(OrderConfirmationEmail(orderConfirmationEmailSchema.parse(input.data)));
  for (const value of ['GB82 WEST 1234 5698 7654 32', 'BIS-TEST-123', 'priložite potrdilo o nakazilu', 'dokončno potrjeno ob prejemu potrdila o nakazilu']) expect(html).toContain(value);
});
it('escapes customer and product text in the branded HTML message', async () => {
  await sendOrderConfirmation({ ...input, data: { ...input.data, customerName: '<script>alert(1)</script>', items: [{ name: '<img src=x onerror=alert(1)>', quantity: 1, lineTotalCents: 1450 }] } });
  const { html } = mocks.send.mock.calls[0][0];
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<img src=x');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('&lt;img');
});
it('produces a multipart email with the branded HTML and readable text without using SMTP', async () => {
  await sendOrderConfirmation(input);
  const transport = createTransport({ streamTransport: true, buffer: true });
  const message = await transport.sendMail(mocks.send.mock.calls[0][0]);
  const parsed = await simpleParser(message.message);
  expect(parsed.headers.get('content-type')).toMatchObject({ value: 'multipart/alternative' });
  expect(parsed.html).toContain('https://bistrava.com/brand/bistrava-logo-web.png');
  expect(parsed.html).toContain('GB82 WEST 1234 5698 7654 32');
  expect(parsed.text).toContain('GB82WEST12345698765432');
  expect(parsed.text).toContain('priložite potrdilo o nakazilu');
  expect(parsed.replyTo?.text).toContain('kontakt@bistrava.com');
  transport.close();
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
