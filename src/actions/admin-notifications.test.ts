import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ access: vi.fn(), client: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/admin", () => ({ getAdminAccess: mocks.access }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));

import { markAdminNotificationsRead } from "@/actions/admin-notifications";
import { GET } from "@/app/admin/notifications/route";

const id = "11111111-1111-4111-8111-111111111111";
const snapshot = { counts: { orders: 1, inquiries: 0, email: 0 }, items: [{ category: "orders", entityId: id, label: "ORDER-TEST", status: "pending", createdAt: "2026-10-09T12:00:00+00:00" }] };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.access.mockResolvedValue({ status: "authorized", userId: "current-admin", role: "admin" });
  mocks.client.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: snapshot, error: null });
});

describe("private notification endpoint", () => {
  it.each([["unauthenticated", 401], ["forbidden", 403], ["not_configured", 401]])("rejects %s without reading notification data", async (status, expected) => {
    mocks.access.mockResolvedValue({ status });
    const response = await GET();
    expect(response.status).toBe(expected);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns a private snapshot without database extras", async () => {
    mocks.rpc.mockResolvedValue({ data: { ...snapshot, unexpected: "not-for-browser" }, error: null });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(snapshot);
    expect(response.headers.get("Vary")).toBe("Cookie");
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
    expect(mocks.rpc).toHaveBeenCalledWith("get_admin_notifications");
  });

  it("never represents malformed or unavailable data as zero unread", async () => {
    for (const result of [{ data: null, error: { message: "private detail" } }, { data: { counts: { orders: -1 } }, error: null }]) {
      mocks.rpc.mockResolvedValue(result);
      const response = await GET();
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "unavailable" });
    }
  });
});

describe("personal notification read acknowledgements", () => {
  it("requires active staff authorization", async () => {
    mocks.access.mockResolvedValue({ status: "forbidden" });
    expect(await markAdminNotificationsRead("orders", [id])).toEqual({ status: "error" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("lets an editor acknowledge only the supplied snapshot, with identity derived by the database", async () => {
    mocks.access.mockResolvedValue({ status: "authorized", userId: "editor", role: "editor" });
    mocks.rpc.mockResolvedValue({ data: 1, error: null });
    expect(await markAdminNotificationsRead("orders", [id, id])).toEqual({ status: "success" });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("mark_admin_notifications_read", { input_category: "orders", input_entity_ids: [id] });
  });

  it("rejects malformed, empty, excessive or unknown categories before mutation", async () => {
    for (const [category, ids] of [["all", [id]], ["orders", []], ["email", ["invalid"]], ["inquiries", Array(101).fill(id)], ["orders", null]]) {
      expect(await markAdminNotificationsRead(category, ids)).toEqual({ status: "error" });
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns a retryable error when the database rejects or the connection fails", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "notification_not_found" } });
    expect(await markAdminNotificationsRead("email", [id])).toEqual({ status: "error" });
    mocks.rpc.mockRejectedValue(new Error("network"));
    expect(await markAdminNotificationsRead("email", [id])).toEqual({ status: "error" });
  });
});
