import { afterEach, describe, expect, it, vi } from "vitest";

import { paymentLinkToken, paymentLinkUrl, verifyPaymentLinkToken } from "@/lib/payments/payment-link";

vi.mock("server-only", () => ({}));

const orderId = "11111111-1111-4111-8111-111111111111";

describe("card payment links", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("signs each order separately and rejects altered or foreign tokens", () => {
    vi.stubEnv("RATE_LIMIT_SALT", "example-only-salt-1234567890");
    const token = paymentLinkToken(orderId);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(verifyPaymentLinkToken(orderId, token!)).toBe(true);
    expect(verifyPaymentLinkToken("22222222-2222-4222-8222-222222222222", token!)).toBe(false);
    expect(verifyPaymentLinkToken(orderId, `${token!.slice(0, -1)}A`)).toBe(token!.endsWith("A"));
    expect(verifyPaymentLinkToken(orderId, undefined)).toBe(false);
  });

  it("builds an HTTPS link on the site and disables links without a server secret", () => {
    vi.stubEnv("RATE_LIMIT_SALT", "example-only-salt-1234567890");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bistrava.com");
    expect(paymentLinkUrl(orderId, "BIS-261025-ABCDEF12")).toMatch(/^https:\/\/bistrava\.com\/placilo\/BIS-261025-ABCDEF12\?k=[A-Za-z0-9_-]{43}$/);
    vi.stubEnv("RATE_LIMIT_SALT", "");
    expect(paymentLinkUrl(orderId, "BIS-261025-ABCDEF12")).toBeNull();
    expect(verifyPaymentLinkToken(orderId, "anything")).toBe(false);
  });
});
