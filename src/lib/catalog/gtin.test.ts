import { describe, expect, it } from "vitest";

import { isValidGtin, normalizeGtin } from "@/lib/catalog/gtin";

describe("GTIN validation", () => {
  it("accepts researched manufacturer EAN-13 codes", () => {
    expect(isValidGtin("8019495399317")).toBe(true);
    expect(isValidGtin("5425024030034")).toBe(true);
  });

  it("accepts the other GS1 lengths", () => {
    expect(isValidGtin("96385074")).toBe(true);
    expect(isValidGtin("036000291452")).toBe(true);
    expect(isValidGtin("10036000291459")).toBe(true);
  });

  it("rejects a wrong check digit, unsupported lengths and supplier phone numbers", () => {
    expect(isValidGtin("8019495399318")).toBe(false);
    expect(isValidGtin("12345678901")).toBe(false);
    expect(isValidGtin("RB-29090500")).toBe(false);
  });

  it("normalizes spacing and drops invalid values", () => {
    expect(normalizeGtin(" 8019495 399317 ")).toBe("8019495399317");
    expect(normalizeGtin("8019495399318")).toBeNull();
    expect(normalizeGtin(null)).toBeNull();
  });
});
