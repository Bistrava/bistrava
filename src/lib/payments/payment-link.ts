import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

// A signed, order-specific token lets the customer open the card payment page from an e-mail
// without the browser cookie created at checkout. It reveals only the amount and items.
function secret() {
  const salt = process.env.RATE_LIMIT_SALT;
  return salt && salt.length >= 16 ? salt : null;
}

export function paymentLinkToken(orderId: string) {
  const key = secret();
  return key ? createHmac("sha256", key).update(`bistrava-payment-link:${orderId}`).digest("base64url") : null;
}

export function verifyPaymentLinkToken(orderId: string, token: string | undefined) {
  const expected = paymentLinkToken(orderId);
  if (!expected || !token || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function paymentLinkUrl(orderId: string, reference: string) {
  const token = paymentLinkToken(orderId);
  if (!token) return null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bistrava.com";
  const url = new URL(`/placilo/${reference}`, siteUrl);
  url.searchParams.set("k", token);
  return url.toString();
}
