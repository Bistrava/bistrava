import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(), reset: vi.fn(), verifyOtp: vi.fn(), exchange: vi.fn(),
  getUser: vi.fn(), updateUser: vi.fn(), signOut: vi.fn(), maybeSingle: vi.fn(), from: vi.fn(), eq: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/seo/site", () => ({ siteConfig: { url: "https://bistrava-six.vercel.app" } }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));

import { confirmAdminPasswordRecovery, requestAdminPasswordReset, updateAdminPassword } from "@/actions/admin-password";

const idle = { status: "idle" as const };
const fields = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) data.set(name, value);
  return data;
};
const validPassword = () => fields({ password: "A new secure test passphrase", confirmPassword: "A new secure test passphrase" });

beforeEach(() => {
  vi.resetAllMocks();
  const query = { select: vi.fn(), eq: mocks.eq, maybeSingle: mocks.maybeSingle };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  mocks.from.mockReturnValue(query);
  mocks.createClient.mockResolvedValue({
    auth: {
      resetPasswordForEmail: mocks.reset, verifyOtp: mocks.verifyOtp, exchangeCodeForSession: mocks.exchange,
      getUser: mocks.getUser, updateUser: mocks.updateUser, signOut: mocks.signOut,
    }, from: mocks.from,
  });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null });
  mocks.maybeSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
  for (const mock of [mocks.reset, mocks.verifyOtp, mocks.exchange, mocks.updateUser, mocks.signOut]) mock.mockResolvedValue({ error: null });
});

describe("administrator password recovery", () => {
  it("uses the trusted application callback and ignores user-supplied redirects", async () => {
    const result = await requestAdminPasswordReset(idle, fields({ email: " ADMIN@example.com ", redirectTo: "https://attacker.invalid" }));
    expect(result.status).toBe("success");
    expect(mocks.reset).toHaveBeenCalledWith("admin@example.com", { redirectTo: "https://bistrava-six.vercel.app/admin/obnovitev-gesla/potrditev" });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects invalid input before contacting the auth provider", async () => {
    expect((await requestAdminPasswordReset(idle, fields({ email: "not-an-email" }))).status).toBe("error");
    expect(mocks.reset).not.toHaveBeenCalled();
  });

  it("reports send failures instead of falsely claiming an email was sent", async () => {
    mocks.reset.mockResolvedValue({ error: { status: 429 } });
    expect((await requestAdminPasswordReset(idle, fields({ email: "admin@example.com" }))).status).toBe("error");
  });

  it("rejects missing or ambiguous recovery proofs without consuming either", async () => {
    const token = "a".repeat(64);
    for (const input of [fields({}), fields({ code: token, token_hash: token })]) {
      await expect(confirmAdminPasswordRecovery(input)).rejects.toThrow("REDIRECT:/admin/mot-de-passe-oublie?error=link");
    }
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(mocks.exchange).not.toHaveBeenCalled();
  });

  it("accepts only the recovery OTP type and clears tokens from the destination", async () => {
    const token = "a".repeat(64);
    await expect(confirmAdminPasswordRecovery(fields({ token_hash: token, type: "signup", next: "https://attacker.invalid" }))).rejects.toThrow("REDIRECT:/admin/novo-geslo");
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: token, type: "recovery" });
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.exchange).not.toHaveBeenCalled();
  });

  it("rejects expired or wrong-browser PKCE codes", async () => {
    const code = "a".repeat(32);
    mocks.exchange.mockResolvedValue({ error: { code: "bad_code_verifier" } });
    await expect(confirmAdminPasswordRecovery(fields({ code }))).rejects.toThrow("REDIRECT:/admin/mot-de-passe-oublie?error=link");
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("accepts a valid PKCE code only after session and active role verification", async () => {
    const code = "a".repeat(32);
    await expect(confirmAdminPasswordRecovery(fields({ code }))).rejects.toThrow("REDIRECT:/admin/novo-geslo");
    expect(mocks.exchange).toHaveBeenCalledWith(code);
    expect(mocks.eq).toHaveBeenCalledWith("profile_id", "admin-id");
    expect(mocks.eq).toHaveBeenCalledWith("active", true);
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it("rejects a proof when the resulting session cannot be verified", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { code: "session_not_found" } });
    await expect(confirmAdminPasswordRecovery(fields({ token_hash: "a".repeat(64) }))).rejects.toThrow("REDIRECT:/admin/mot-de-passe-oublie?error=link");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("does not authorize a recovered account without an active administrator role", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(confirmAdminPasswordRecovery(fields({ token_hash: "a".repeat(64) }))).rejects.toThrow("REDIRECT:/admin/connexion?error=denied");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("requires a verified session and an active role for every password change", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { code: "session_not_found" } });
    expect((await updateAdminPassword(idle, validPassword())).status).toBe("error");
    expect(mocks.updateUser).not.toHaveBeenCalled();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "customer" } }, error: null });
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await updateAdminPassword(idle, validPassword())).status).toBe("error");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("fails closed when the administrator role lookup fails", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { code: "db_error" } });
    expect((await updateAdminPassword(idle, validPassword())).status).toBe("error");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("rejects mismatched or short passwords even when HTML validation is bypassed", async () => {
    for (const input of [fields({ password: "short", confirmPassword: "short" }), fields({ password: "A secure long passphrase", confirmPassword: "A different long passphrase" })]) {
      expect((await updateAdminPassword(idle, input)).status).toBe("error");
    }
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("keeps the recovery session available to retry a password rejected by Supabase", async () => {
    mocks.updateUser.mockResolvedValue({ error: { code: "weak_password" } });
    expect((await updateAdminPassword(idle, validPassword())).status).toBe("error");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("updates only the verified account, revokes sessions, then returns to login", async () => {
    const input = validPassword();
    input.set("userId", "another-account");
    await expect(updateAdminPassword(idle, input)).rejects.toThrow("REDIRECT:/admin/connexion?success=password-updated");
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: input.get("password") });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "global" });
  });

  it("distinguishes a saved password from failure to revoke other sessions", async () => {
    mocks.signOut.mockResolvedValue({ error: { code: "network_error" } });
    const result = await updateAdminPassword(idle, validPassword());
    expect(result.status).toBe("success");
    expect(result.message).toContain("enregistré");
    expect(result.message).toContain("n’a pas pu être confirmée");
  });
});
