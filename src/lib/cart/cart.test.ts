import { describe, expect, it } from "vitest";

import {
  cartItemCount,
  cartReducer,
  cartSubtotal,
  parseStoredCart,
  type CartProductSnapshot,
} from "@/lib/cart/cart";

const product: CartProductSnapshot = {
  sku: "BIS-030",
  slug: "tabletirana-sol-25-kg",
  nameSl: "Tabletirana sol 25 kg",
  unitPriceCents: 1499,
  imageUrl: "/products/tabletirana-sol-25-kg/official-1.jpg",
  imageAltSl: "Tabletirana sol 25 kg",
  stockQuantity: 5,
};

describe("cart", () => {
  it("adds, merges and clamps a cart line to available stock", () => {
    const added = cartReducer({ lines: [] }, { type: "add", product, quantity: 2 });
    const merged = cartReducer(added, { type: "add", product, quantity: 10 });

    expect(merged.lines).toEqual([{ ...product, quantity: 5 }]);
    expect(cartItemCount(merged.lines)).toBe(5);
    expect(cartSubtotal(merged.lines)).toBe(7495);
  });

  it("updates and removes quantities deterministically", () => {
    const state = { lines: [{ ...product, quantity: 2 }] };
    expect(
      cartReducer(state, { type: "set_quantity", sku: product.sku, quantity: 3 }).lines[0]
        .quantity,
    ).toBe(3);
    expect(
      cartReducer(state, { type: "set_quantity", sku: product.sku, quantity: 0 }).lines,
    ).toEqual([]);
  });

  it("rejects malformed persisted browser data", () => {
    expect(parseStoredCart("not-json")).toEqual([]);
    expect(parseStoredCart(JSON.stringify([{ sku: "BIS-030", quantity: -2 }]))).toEqual([]);
    expect(parseStoredCart(JSON.stringify([{ ...product, quantity: 40 }]))[0].quantity).toBe(5);
  });
});
