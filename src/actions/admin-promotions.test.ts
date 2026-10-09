import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ access: vi.fn(), client: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth/admin", () => ({ getAdminAccess: mocks.access }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { archiveAdminPromotion, saveAdminPromotion } from "./admin-promotions";

const form = () => {
  const data = new FormData();
  for (const [name, value] of Object.entries({ id: "", codeId: "", expectedUpdatedAt: "", name: "Example campaign", description: "", type: "percentage", value: "10", code: "LOCAL_TEST", startsAt: "", endsAt: "", minimumOrderCents: "", usageLimit: "", codeUsageLimit: "", codeActive: "on" })) data.set(name, value);
  return data;
};

beforeEach(() => { vi.clearAllMocks(); mocks.client.mockResolvedValue({ rpc: mocks.rpc }); mocks.rpc.mockResolvedValue({ error: null }); });

describe("promotion mutation permissions", () => {
  it.each([{ status: "unauthenticated" }, { status: "authorized", role: "editor" }])("rejects non-admin access before querying the database (%j)", async (access) => {
    mocks.access.mockResolvedValue(access);
    expect((await saveAdminPromotion({ status: "idle", message: "" }, form())).status).toBe("error");
    expect((await archiveAdminPromotion("10000000-0000-4000-8000-000000000001", "2026-10-08T10:00:00Z")).status).toBe("error");
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("uses the authenticated RPC and never accepts submitted usage counts", async () => {
    mocks.access.mockResolvedValue({ status: "authorized", role: "admin" });
    const submitted = form(); submitted.set("used_count", "0"); submitted.set("active", "on");
    expect((await saveAdminPromotion({ status: "idle", message: "" }, submitted)).status).toBe("success");
    const payload = mocks.rpc.mock.calls[0][1].input_promotion;
    expect(payload.used_count).toBeUndefined();
    expect(payload.active).toBe(true);
    expect(mocks.rpc.mock.calls[0][0]).toBe("save_admin_promotion");
  });
  it("maps unique-code conflicts without exposing database internals", async () => {
    mocks.access.mockResolvedValue({ status: "authorized", role: "admin" });
    mocks.rpc.mockResolvedValue({ error: { code: "23505", message: "private constraint info" } });
    const result = await saveAdminPromotion({ status: "idle", message: "" }, form());
    expect(result.status).toBe("error"); expect(result.message).toContain("Ce code existe déjà"); expect(result.message).not.toContain("constraint");
  });
});
