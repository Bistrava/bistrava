import { describe, expect, it } from "vitest";

import { applyStockDelta, assertStockAvailable } from "./stock";

describe("inventory rules", () => {
  it("applies a valid stock delta", () => {
    expect(applyStockDelta(10, -3)).toBe(7);
    expect(applyStockDelta(7, 5)).toBe(12);
  });

  it("prevents negative inventory", () => {
    expect(() => applyStockDelta(2, -3)).toThrow(
      "Inventory cannot become negative.",
    );
  });

  it("rejects requests above available stock", () => {
    expect(() => assertStockAvailable(2, 3)).toThrow(
      "Requested quantity exceeds available inventory.",
    );
    expect(() => assertStockAvailable(3, 3)).not.toThrow();
  });
});
