"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  CART_STORAGE_KEY,
  cartItemCount,
  cartMatchesCatalog,
  cartReducer,
  cartSubtotal,
  parseStoredCartState,
  type CartAction,
  type CartCatalogSnapshot,
  type CartChange,
  type CartLine,
  type CartProductSnapshot,
  type CartState,
} from "@/lib/cart/cart";

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  hydrated: boolean;
  changes: CartChange[];
  addItem: (product: CartProductSnapshot, quantity?: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  removeItem: (sku: string) => void;
  clearCart: () => void;
  syncCatalog: (catalog: CartCatalogSnapshot) => void;
  acknowledgeChanges: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const emptyLines: CartLine[] = [];
const emptyChanges: CartChange[] = [];
const emptyCart: CartState = { lines: emptyLines, changes: emptyChanges };
const cartListeners = new Set<() => void>();
let browserCart: CartState = emptyCart;
let browserCartLoaded = false;

function loadBrowserCart() {
  if (browserCartLoaded || typeof window === "undefined") return;
  try {
    browserCart = parseStoredCartState(localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    // The cart remains usable in memory when browser storage is unavailable.
    browserCart = emptyCart;
  }
  browserCartLoaded = true;
}

function getCartSnapshot() {
  loadBrowserCart();
  return browserCart;
}

function getServerCartSnapshot() {
  return emptyCart;
}

function subscribeToCart(listener: () => void) {
  loadBrowserCart();
  cartListeners.add(listener);
  const syncAcrossTabs = (event: StorageEvent) => {
    if (event.key !== CART_STORAGE_KEY) return;
    browserCart = parseStoredCartState(event.newValue);
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
  const updated = cartReducer(browserCart, action);
  if (updated === browserCart) return;
  browserCart = updated;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 2, ...browserCart }));
  } catch {
    // Preserve the in-memory cart even if persistence is blocked or full.
  }
  cartListeners.forEach((listener) => listener());
}

function subscribeToHydration() {
  return () => undefined;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);
  const { lines } = cart;
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
  const syncCatalog = useCallback((catalog: CartCatalogSnapshot) => {
    dispatchCart({ type: "sync_catalog", catalog });
  }, []);
  const acknowledgeChanges = useCallback(() => dispatchCart({ type: "acknowledge_changes" }), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount: cartItemCount(lines),
      subtotalCents: cartSubtotal(lines),
      hydrated,
      changes: cart.changes ?? emptyChanges,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      syncCatalog,
      acknowledgeChanges,
    }),
    [acknowledgeChanges, addItem, cart.changes, clearCart, hydrated, lines, removeItem, setQuantity, syncCatalog],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

export function useCartCatalog(catalog: CartCatalogSnapshot) {
  const { lines, hydrated, syncCatalog } = useCart();
  useEffect(() => {
    if (hydrated) syncCatalog(catalog);
  }, [catalog, hydrated, lines, syncCatalog]);
  return hydrated && cartMatchesCatalog(lines, catalog);
}
