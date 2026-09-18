import { describe, expect, it } from "vitest";

import { calculateCartTotal, calculateLineTotal, formatMoney } from "./money";

describe("money rules", () => {
  it("calculates line and cart totals in integer cents", () => {
    expect(calculateLineTotal(1_299, 3)).toBe(3_897);
    expect(
      calculateCartTotal([
        { unitPriceCents: 1_299, quantity: 3 },
        { unitPriceCents: 450, quantity: 2 },
      ]),
    ).toBe(4_797);
  });

  it("rejects fractional cents and invalid quantities", () => {
    expect(() => calculateLineTotal(12.5, 1)).toThrow();
    expect(() => calculateLineTotal(1_000, 0)).toThrow();
  });

  it("formats Slovenian EUR amounts", () => {
    expect(formatMoney(74_900)).toMatch(/749,00\s€/);
  });
});
