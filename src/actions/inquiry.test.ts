import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  headers: vi.fn(),
  insert: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/email/send-inquiry", () => ({ sendInquiryNotifications: mocks.notify }));

import { submitInquiry } from "./inquiry";

let requestNumber = 0;

function inquiryForm() {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    type: "contact",
    name: "Example Customer",
    email: "customer@example.test",
    message: "Prosim za dodatne informacije o izdelku.",
    consent: "on",
  })) form.set(name, value);
  return form;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": `198.51.100.${++requestNumber}` }));
  mocks.createAdminClient.mockReturnValue({ from: () => ({ insert: mocks.insert }) });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.notify.mockResolvedValue({ ok: true });
});

describe("inquiry submission", () => {
  it("acknowledges the saved request even when the email provider throws", async () => {
    mocks.notify.mockRejectedValue(new Error("Email provider unavailable"));

    await expect(submitInquiry({ status: "idle", message: "" }, inquiryForm())).resolves.toMatchObject({
      status: "success",
      message: expect.stringContaining("varno shranjeno"),
    });
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      email: "customer@example.test",
      message: "Prosim za dodatne informacije o izdelku.",
    }));
  });

  it("does not claim that mail was delivered when sending is unconfigured", async () => {
    mocks.notify.mockResolvedValue({ ok: false, reason: "not_configured" });

    const result = await submitInquiry({ status: "idle", message: "" }, inquiryForm());
    expect(result.status).toBe("success");
    expect(result.message).toContain("Če je e-pošta konfigurirana");
  });

  it("does not notify or claim success when the database rejects the request", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "Database unavailable" } });

    expect((await submitInquiry({ status: "idle", message: "" }, inquiryForm())).status).toBe("error");
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("rejects missing consent before accessing services", async () => {
    const form = inquiryForm();
    form.delete("consent");

    expect((await submitInquiry({ status: "idle", message: "" }, form)).status).toBe("error");
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});
