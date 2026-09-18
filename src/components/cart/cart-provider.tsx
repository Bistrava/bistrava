"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  CART_STORAGE_KEY,
  cartItemCount,
  cartReducer,
  cartSubtotal,
  parseStoredCart,
  type CartAction,
  type CartLine,
  type CartProductSnapshot,
} from "@/lib/cart/cart";

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  hydrated: boolean;
  addItem: (product: CartProductSnapshot, quantity?: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  removeItem: (sku: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const emptyLines: CartLine[] = [];
const cartListeners = new Set<() => void>();
let browserLines: CartLine[] = emptyLines;
let browserCartLoaded = false;

function loadBrowserCart() {
  if (browserCartLoaded || typeof window === "undefined") return;
  browserLines = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
  browserCartLoaded = true;
}

function getCartSnapshot() {
  loadBrowserCart();
  return browserLines;
}

function getServerCartSnapshot() {
  return emptyLines;
}

function subscribeToCart(listener: () => void) {
  loadBrowserCart();
  cartListeners.add(listener);
  const syncAcrossTabs = (event: StorageEvent) => {
    if (event.key !== CART_STORAGE_KEY) return;
    browserLines = parseStoredCart(event.newValue);
    cartListeners.forEach((notify) => notify());
  };
  window.addEventListener("storage", syncAcrossTabs);
  return () => {
    cartListeners.delete(listener);
    window.removeEventListener("storage", syncAcrossTabs);
  };
}

function dispatchCart(action: CartAction) {
  loadBrowserCart();
  browserLines = cartReducer({ lines: browserLines }, action).lines;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(browserLines));
  cartListeners.forEach((listener) => listener());
}

function subscribeToHydration() {
  return () => undefined;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  const addItem = useCallback((product: CartProductSnapshot, quantity = 1) => {
    dispatchCart({ type: "add", product, quantity });
  }, []);
  const setQuantity = useCallback((sku: string, quantity: number) => {
    dispatchCart({ type: "set_quantity", sku, quantity });
  }, []);
  const removeItem = useCallback((sku: string) => {
    dispatchCart({ type: "remove", sku });
  }, []);
  const clearCart = useCallback(() => dispatchCart({ type: "clear" }), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount: cartItemCount(lines),
      subtotalCents: cartSubtotal(lines),
      hydrated,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, hydrated, lines, removeItem, setQuantity],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
