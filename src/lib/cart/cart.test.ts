import { describe, expect, it } from "vitest";

import {
  cartItemCount,
  cartMatchesCatalog,
  cartReducer,
  cartSubtotal,
  parseStoredCart,
  parseStoredCartState,
  reconcileCart,
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

  it("refreshes a legacy cart with the current selling price and increased stock", () => {
    const lines = parseStoredCart(JSON.stringify([{ ...product, quantity: 2 }]));
    const current = { ...product, unitPriceCents: 1528, stockQuantity: 15 };
    const refreshed = reconcileCart({ lines }, { verified: true, products: [current] });

    expect(refreshed.lines).toEqual([{ ...current, quantity: 2 }]);
    expect(cartSubtotal(refreshed.lines)).toBe(3056);
    expect(refreshed.changes).toEqual([{
      sku: product.sku, nameSl: product.nameSl, kind: "price", previousValue: 1499, nextValue: 1528,
    }]);
    expect(cartMatchesCatalog(refreshed.lines, { verified: true, products: [current] })).toBe(true);
    expect(cartReducer(refreshed, { type: "set_quantity", sku: product.sku, quantity: 15 }).lines[0].quantity).toBe(15);
  });

  it("updates increased stock without requiring acknowledgement of unchanged totals", () => {
    const refreshed = reconcileCart(
      { lines: [{ ...product, quantity: 2 }] },
      { verified: true, products: [{ ...product, stockQuantity: 15 }] },
    );
    expect(refreshed.lines[0].stockQuantity).toBe(15);
    expect(refreshed.changes).toEqual([]);
  });

  it("preserves the entire stored cart when catalog verification fails", () => {
    const state = { lines: [{ ...product, quantity: 2 }] };
    expect(reconcileCart(state, { verified: false, products: [] })).toBe(state);
    expect(cartMatchesCatalog(state.lines, { verified: false, products: [] })).toBe(false);
  });

  it("removes unavailable products only following an authoritative successful read", () => {
    const state = { lines: [{ ...product, quantity: 2 }] };
    const refreshed = reconcileCart(state, { verified: true, products: [] });
    expect(refreshed.lines).toEqual([]);
    expect(refreshed.changes).toEqual([{
      sku: product.sku, nameSl: product.nameSl, kind: "unavailable", previousValue: 2, nextValue: 0,
    }]);
  });

  it("clamps reduced stock and records the quantity change for review", () => {
    const refreshed = reconcileCart(
      { lines: [{ ...product, quantity: 5 }] },
      { verified: true, products: [{ ...product, stockQuantity: 2 }] },
    );
    expect(refreshed.lines[0].quantity).toBe(2);
    expect(refreshed.changes?.[0]).toMatchObject({ kind: "quantity", previousValue: 5, nextValue: 2 });
  });

  it("persists pending price review through reload and clears it only on acknowledgement", () => {
    const current = { ...product, unitPriceCents: 1528, stockQuantity: 15 };
    const catalog = { verified: true, products: [current] };
    const refreshed = cartReducer(
      { lines: [{ ...product, quantity: 2 }] },
      { type: "sync_catalog", catalog },
    );
    const restored = parseStoredCartState(JSON.stringify({ version: 2, ...refreshed }));
    expect(restored).toEqual(refreshed);
    // A second page sync must not silently acknowledge previous price changes.
    expect(cartReducer(restored, { type: "sync_catalog", catalog })).toBe(restored);
    expect(cartReducer(restored, { type: "acknowledge_changes" }).changes).toEqual([]);
  });

  it("keeps a stable reference when an already-current cart is synchronized", () => {
    const state = { lines: [{ ...product, quantity: 2 }] };
    expect(reconcileCart(state, { verified: true, products: [product] })).toBe(state);
  });
});
