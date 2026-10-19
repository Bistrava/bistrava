import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const mocks = vi.hoisted(() => ({
  configured: vi.fn(), transport: vi.fn(), send: vi.fn(), close: vi.fn(),
  client: vi.fn(), from: vi.fn(), insert: vi.fn(), update: vi.fn(), previous: vi.fn(),
  resendCreated: vi.fn(), resendSend: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/email/mailbox", () => ({
  mailboxAddress: "kontakt@bistrava.com", mailboxConfigured: mocks.configured, smtpTransport: mocks.transport,
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.client }));
vi.mock("resend", () => ({ Resend: class {
  emails = { send: mocks.resendSend };
  constructor(key: string) { mocks.resendCreated(key); }
} }));

import { sendInquiryNotifications } from "./send-inquiry";

type Event = {
  id: string; email_type: string; recipient_hash: string; idempotency_key: string;
  provider_message_id: string; status: string; error_code?: string | null;
};
let events: Map<string, Event>;
const input = {
  requestId: "12345678-1234-4234-8234-123456789abc", type: "contact", name: "Example Customer",
  email: "customer@example.test", phone: null, message: "Prosim za dodatne informacije o izdelku.",
};
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

beforeEach(() => {
  vi.resetAllMocks();
  events = new Map();
  for (const name of ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO", "EMAIL_INTERNAL_TO"]) vi.stubEnv(name, "");
  mocks.configured.mockReturnValue(true);
  mocks.transport.mockImplementation(() => ({ sendMail: mocks.send, close: mocks.close }));
  mocks.send.mockImplementation(async (mail: { to: string }) => ({ accepted: [mail.to] }));
  mocks.insert.mockImplementation(async (row: Event) => {
    if (events.has(row.idempotency_key)) return { error: { code: "23505" } };
    events.set(row.idempotency_key, { ...row });
    return { error: null };
  });
  mocks.update.mockImplementation(async (value: Partial<Event>, id: string) => {
    const event = [...events.values()].find(row => row.id === id);
    if (event) Object.assign(event, value);
    return { error: null };
  });
  mocks.previous.mockImplementation(async (key: string) => ({ data: events.get(key) ?? null, error: null }));
  mocks.from.mockImplementation(() => ({
    insert: mocks.insert,
    update: (value: Partial<Event>) => ({ eq: (_field: string, id: string) => mocks.update(value, id) }),
    select: () => ({ eq: (_field: string, key: string) => ({ maybeSingle: () => mocks.previous(key) }) }),
  }));
  mocks.client.mockReturnValue({ from: mocks.from });
  mocks.resendSend.mockResolvedValue({ data: { id: "resend-local-test" }, error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe("inquiry notification transports", () => {
  it("uses LWS without Resend or EMAIL variables for both independently journalled messages", async () => {
    expect(await sendInquiryNotifications(input)).toMatchObject({ ok: true });
    expect(mocks.resendCreated).not.toHaveBeenCalled();
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.send).toHaveBeenNthCalledWith(1, expect.objectContaining({
      from: { name: "Bistrava", address: "kontakt@bistrava.com" }, to: input.email, replyTo: "kontakt@bistrava.com",
      text: expect.stringContaining(input.message),
    }));
    expect(mocks.send).toHaveBeenNthCalledWith(2, expect.objectContaining({
      to: "kontakt@bistrava.com", replyTo: input.email, text: expect.stringContaining(input.requestId),
    }));
    for (const [mail] of mocks.send.mock.calls) {
      expect(mail.html).toContain('https://bistrava.com/brand/bistrava-logo-web.png');
      expect(mail.html).toContain('alt="Bistrava"');
      expect(mail.html).toContain('#10324A');
      expect(mail.html).toContain('#20B8A6');
      expect(mail.html).toContain(input.message);
      expect(mail.html).toContain(input.requestId);
      expect(mail.text).toContain(input.message);
    }
    expect([...events.values()].map(row => [row.email_type, row.status, row.recipient_hash])).toEqual([
      ["inquiry_acknowledgement", "sent", hash(input.email)],
      ["inquiry_internal", "sent", hash("kontakt@bistrava.com")],
    ]);
    expect(mocks.from.mock.calls.every(([table]) => table === "email_events")).toBe(true);
    expect(mocks.close).toHaveBeenCalledTimes(2);
  });

  it('escapes submitted text in customer and internal HTML without changing reply routing', async () => {
    const unsafe = { ...input, name: '<script>unsafe</script>', message: '<img src=x onerror=alert(1)>\nDruga vrstica.' };
    expect((await sendInquiryNotifications(unsafe)).ok).toBe(true);
    for (const [mail] of mocks.send.mock.calls) {
      expect(mail.html).not.toContain('<script>');
      expect(mail.html).not.toContain('<img src=x');
      expect(mail.html).toContain('&lt;script&gt;');
      expect(mail.html).toContain('&lt;img');
      expect(mail.html).toContain('white-space:pre-wrap');
    }
    expect(mocks.send.mock.calls[0][0].replyTo).toBe('kontakt@bistrava.com');
    expect(mocks.send.mock.calls[1][0].replyTo).toBe(input.email);
  });

  it("does not repeat either SMTP message for the same saved inquiry", async () => {
    const first = await sendInquiryNotifications(input);
    expect(first.ok).toBe(true);
    expect(await sendInquiryNotifications(input)).toEqual(first);
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(events.size).toBe(2);
    expect(mocks.transport).toHaveBeenCalledTimes(2);
  });

  it("records uncertain SMTP failure, still attempts the internal notice and never automatically retries", async () => {
    mocks.send.mockRejectedValueOnce(new Error("socket closed after DATA; private provider detail"));
    await expect(sendInquiryNotifications(input)).resolves.toMatchObject({ ok: false });
    expect([...events.values()].map(row => [row.status, row.error_code])).toEqual([
      ["failed", "smtp_delivery_unconfirmed"], ["sent", null],
    ]);
    expect(mocks.send).toHaveBeenCalledTimes(2);
    await expect(sendInquiryNotifications(input)).resolves.toMatchObject({ ok: false });
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.close).toHaveBeenCalledTimes(2);
    expect(JSON.stringify([...events.values()])).not.toContain("private provider detail");
  });

  it("keeps a successful client acknowledgement when only the internal notice is rejected", async () => {
    mocks.send.mockResolvedValueOnce({ accepted: [input.email] }).mockResolvedValueOnce({ accepted: [] });
    expect((await sendInquiryNotifications(input)).ok).toBe(false);
    expect([...events.values()].map(row => [row.status, row.error_code])).toEqual([
      ["sent", null], ["failed", "smtp_rejected"],
    ]);
    await sendInquiryNotifications(input);
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it("does not change providers after an uncertain SMTP result even if Resend is also configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_local_test_only");
    vi.stubEnv("EMAIL_FROM", "sender@example.test");
    vi.stubEnv("EMAIL_REPLY_TO", "reply@example.test");
    vi.stubEnv("EMAIL_INTERNAL_TO", "staff@example.test");
    mocks.send.mockRejectedValue(new Error("uncertain SMTP acceptance"));
    expect((await sendInquiryNotifications(input)).ok).toBe(false);
    expect(mocks.resendCreated).not.toHaveBeenCalled();
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it("does not send before a durable reservation or when the database is missing", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "database_unavailable" } });
    expect((await sendInquiryNotifications(input)).ok).toBe(false);
    mocks.client.mockReturnValue(null);
    expect((await sendInquiryNotifications(input)).ok).toBe(false);
    expect(mocks.transport).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.resendCreated).not.toHaveBeenCalled();
  });

  it("does not resend a queued message when SMTP acceptance could not be recorded", async () => {
    mocks.update.mockResolvedValue({ error: { code: "database_unavailable" } });
    expect((await sendInquiryNotifications(input)).ok).toBe(false);
    expect([...events.values()].map(row => row.status)).toEqual(["queued", "queued"]);
    expect((await sendInquiryNotifications(input)).ok).toBe(false);
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it("keeps reservation identity fixed when the caller reuses an inquiry ID with another recipient", async () => {
    await sendInquiryNotifications(input);
    expect((await sendInquiryNotifications({ ...input, email: "other@example.test" })).ok).toBe(false);
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it("closes transports and returns failure when transport construction or close throws", async () => {
    mocks.transport.mockImplementationOnce(() => { throw new Error("transport unavailable"); });
    mocks.close.mockImplementation(() => { throw new Error("close failed"); });
    await expect(sendInquiryNotifications(input)).resolves.toMatchObject({ ok: false });
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it("rejects recipient header injection before reserving or contacting a service", async () => {
    expect((await sendInquiryNotifications({ ...input, email: "customer@example.test\r\nBcc: victim@example.test" })).ok).toBe(false);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("retains Resend and its stable idempotency keys when LWS is absent", async () => {
    mocks.configured.mockReturnValue(false);
    vi.stubEnv("RESEND_API_KEY", "re_local_test_only");
    vi.stubEnv("EMAIL_FROM", "Bistrava <sender@example.test>");
    vi.stubEnv("EMAIL_REPLY_TO", "reply@example.test");
    vi.stubEnv("EMAIL_INTERNAL_TO", "staff@example.test");
    expect(await sendInquiryNotifications(input)).toMatchObject({ ok: true });
    expect(mocks.resendSend).toHaveBeenNthCalledWith(1, expect.objectContaining({
      to: [input.email], replyTo: "reply@example.test",
    }), { idempotencyKey: `inquiry-ack-${input.requestId}` });
    expect(mocks.resendSend).toHaveBeenNthCalledWith(2, expect.objectContaining({
      to: ["staff@example.test"], replyTo: input.email,
    }), { idempotencyKey: `inquiry-internal-${input.requestId}` });
    expect(mocks.transport).not.toHaveBeenCalled();
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("returns a normal unconfigured result when neither transport is configured", async () => {
    mocks.configured.mockReturnValue(false);
    expect(await sendInquiryNotifications(input)).toEqual({ ok: false, reason: "not_configured" });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.resendCreated).not.toHaveBeenCalled();
  });

  it("returns a normal provider error when the fallback provider throws", async () => {
    mocks.configured.mockReturnValue(false);
    vi.stubEnv("RESEND_API_KEY", "re_local_test_only");
    vi.stubEnv("EMAIL_FROM", "sender@example.test");
    vi.stubEnv("EMAIL_REPLY_TO", "reply@example.test");
    vi.stubEnv("EMAIL_INTERNAL_TO", "staff@example.test");
    mocks.resendSend.mockRejectedValue(new Error("provider unavailable"));
    await expect(sendInquiryNotifications(input)).resolves.toMatchObject({ ok: false });
  });
});
