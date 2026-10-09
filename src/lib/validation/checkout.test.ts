import { describe, expect, it } from "vitest";

import { checkoutFormSchema, checkoutQuoteSchema } from "@/lib/validation/checkout";

const validCheckout = {
  email: "maja@example.com",
  phone: "+38640111222",
  firstName: "Maja",
  lastName: "Novak",
  company: "",
  addressLine1: "Slovenska cesta 1",
  addressLine2: "",
  postalCode: "1000",
  city: "Ljubljana",
  countryCode: "SI",
  shippingRateId: "10000000-0000-4000-8000-000000000001",
  customerNote: "",
  termsAccepted: "on",
  website: "",
  idempotencyKey: "20000000-0000-4000-8000-000000000001",
  guestToken: "a".repeat(64),
  expectedTotalCents: "3556",
  cart: JSON.stringify([{ sku: "BIS-030", quantity: 2 }]),
};

describe("checkout validation", () => {
  it("parses a valid Slovenian guest checkout", () => {
    const parsed = checkoutFormSchema.parse(validCheckout);
    expect(parsed.cart).toEqual([{ sku: "BIS-030", quantity: 2 }]);
    expect(parsed.countryCode).toBe("SI");
  });

  it("rejects consent omissions, invalid postcodes and invalid cart quantities", () => {
    const result = checkoutFormSchema.safeParse({
      ...validCheckout,
      postalCode: "100",
      termsAccepted: "",
      cart: JSON.stringify([{ sku: "BIS-030", quantity: 100 }]),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.postalCode).toBeDefined();
      expect(errors.termsAccepted).toBeDefined();
      expect(errors.cart).toBeDefined();
    }
  });

  it("requires explicit acknowledgement of the discounted total", () => {
    expect(checkoutFormSchema.safeParse({ ...validCheckout, discountCode: "BISTRA10" }).success).toBe(false);
    expect(checkoutFormSchema.parse({ ...validCheckout, discountCode: " bistra10 ", discountAcknowledged: "on" }).discountCode).toBe("BISTRA10");
  });

  it("rejects a missing total and negative or fractional cents", () => {
    for (const expectedTotalCents of [undefined, "-1", "10.5", "100000001"]) {
      expect(checkoutFormSchema.safeParse({ ...validCheckout, expectedTotalCents }).success).toBe(false);
    }
  });

  it("validates coupon syntax and quote quantities before any database request", () => {
    const request = { cart: validCheckout.cart, shippingRateId: validCheckout.shippingRateId, discountCode: " bistrava_10 " };
    expect(checkoutQuoteSchema.parse(request).discountCode).toBe("BISTRAVA_10");
    expect(checkoutQuoteSchema.safeParse({ ...request, discountCode: "INVALID CODE!" }).success).toBe(false);
    expect(checkoutQuoteSchema.safeParse({ ...request, cart: '[{"sku":"BIS-030","quantity":0}]' }).success).toBe(false);
  });
});
