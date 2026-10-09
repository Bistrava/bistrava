import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CookieMethodsServer, CookieOptions } from "@supabase/ssr";
import { NextRequest } from "next/server";
// Next 16.3.2 still exports the matcher helper under its earlier name.
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";

const mocks = vi.hoisted(() => ({ createServerClient: vi.fn(), config: vi.fn(), getClaims: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("@/lib/validation/env", () => ({ getPublicSupabaseConfig: mocks.config }));

import { updateSession } from "@/lib/supabase/proxy";
import { config } from "@/proxy";

type ClientOptions = { cookies: CookieMethodsServer; cookieOptions: CookieOptions };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.mockReturnValue({ url: "https://example.supabase.co", publishableKey: "public-test-key" });
  mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "test-user" } }, error: null });
  mocks.createServerClient.mockReturnValue({ auth: { getClaims: mocks.getClaims } });
});
afterEach(() => vi.unstubAllEnvs());

describe("admin session refresh proxy", () => {
  it("matches admin pages and login, excluding storefront and assets", () => {
    for (const url of ["/admin", "/admin/connexion", "/admin/izdelki/example"]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
    }
    for (const url of ["/", "/mehcalci-vode", "/izdelki/example", "/_next/static/test.js", "/administrator"]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
    }
  });

  it("passes refreshed tokens to the current request and the browser without caching them", async () => {
    const request = new NextRequest("https://shop.example/admin", { headers: { cookie: "sb-session=expired; sb-session.1=old-chunk" } });
    mocks.createServerClient.mockImplementation((_url: string, _key: string, options: ClientOptions) => ({ auth: {
      getClaims: async () => {
        expect(options.cookies.getAll?.()).toEqual(expect.arrayContaining([{ name: "sb-session", value: "expired" }]));
        await options.cookies.setAll?.([{ name: "sb-session.1", value: "", options: { path: "/", maxAge: 0 } }], { "Cache-Control": "private, no-store", Expires: "0" });
        await options.cookies.setAll?.([{ name: "sb-session", value: "refreshed-test-token", options: { path: "/", secure: true, sameSite: "lax" } }], { "Cache-Control": "private, no-store", Pragma: "no-cache" });
        return { data: { claims: { sub: "test-user" } }, error: null };
      },
    } }));
    const response = await updateSession(request);
    expect(request.cookies.get("sb-session")?.value).toBe("refreshed-test-token");
    expect(response.cookies.get("sb-session")?.value).toBe("refreshed-test-token");
    expect(response.cookies.get("sb-session")?.secure).toBe(true);
    expect(response.cookies.get("sb-session.1")?.maxAge).toBe(0);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("location")).toBeNull();
  });

  it("verifies claims and leaves login redirects to authorized pages", async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: { message: "No session" } });
    const response = await updateSession(new NextRequest("https://shop.example/admin/connexion"));
    expect(mocks.getClaims).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toContain("private");
  });

  it("uses secure production cookies and only the public key", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await updateSession(new NextRequest("https://shop.example/admin"));
    expect(mocks.createServerClient).toHaveBeenCalledWith("https://example.supabase.co", "public-test-key", expect.objectContaining({ cookieOptions: { sameSite: "lax", secure: true } }));
  });

  it("does not create a client without configuration", async () => {
    mocks.config.mockReturnValue(null);
    const response = await updateSession(new NextRequest("https://shop.example/admin"));
    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});
