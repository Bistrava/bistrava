import { calculateCartTotal } from "@/lib/commerce/money";

export const CART_STORAGE_KEY = "bistrava-cart-v1";
export const MAX_CART_LINE_QUANTITY = 99;

export type CartProductSnapshot = {
  sku: string;
  slug: string;
  nameSl: string;
  unitPriceCents: number;
  imageUrl: string | null;
  imageAltSl: string;
  stockQuantity: number;
};

export type CartLine = CartProductSnapshot & {
  quantity: number;
};

export type CartState = {
  lines: CartLine[];
  changes?: CartChange[];
};

export type CartChange = {
  sku: string;
  nameSl: string;
  kind: "price" | "quantity" | "unavailable";
  previousValue: number;
  nextValue: number;
};

export type CartCatalogSnapshot = {
  verified: boolean;
  products: CartProductSnapshot[];
};

export type CartAction =
  | { type: "replace"; lines: CartLine[] }
  | { type: "sync_catalog"; catalog: CartCatalogSnapshot }
  | { type: "acknowledge_changes" }
  | { type: "add"; product: CartProductSnapshot; quantity: number }
  | { type: "set_quantity"; sku: string; quantity: number }
  | { type: "remove"; sku: string }
  | { type: "clear" };

function safeQuantity(quantity: number, stockQuantity: number) {
  return Math.max(
    1,
    Math.min(Math.trunc(quantity), stockQuantity, MAX_CART_LINE_QUANTITY),
  );
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<CartLine>;
  return (
    typeof line.sku === "string" &&
    typeof line.slug === "string" &&
    typeof line.nameSl === "string" &&
    Number.isInteger(line.unitPriceCents) &&
    Number(line.unitPriceCents) >= 0 &&
    (line.imageUrl === null || typeof line.imageUrl === "string") &&
    typeof line.imageAltSl === "string" &&
    Number.isInteger(line.stockQuantity) &&
    Number(line.stockQuantity) >= 1 &&
    Number.isInteger(line.quantity) &&
    Number(line.quantity) >= 1
  );
}

export function parseStoredCartState(value: string | null): CartState {
  const empty = { lines: [], changes: [] };
  if (!value) return empty;
  try {
    const parsed: unknown = JSON.parse(value);
    const envelope = parsed && typeof parsed === "object" && "version" in parsed &&
      parsed.version === 2 && "lines" in parsed ? parsed : null;
    const storedLines = Array.isArray(parsed) ? parsed : envelope?.lines;
    if (!Array.isArray(storedLines)) return empty;
    const lines = storedLines
      .filter(isCartLine)
      .map((line) => ({
        ...line,
        quantity: safeQuantity(line.quantity, line.stockQuantity),
      }))
      .slice(0, 100);
    const storedChanges = envelope && "changes" in envelope ? envelope.changes : [];
    const changes = Array.isArray(storedChanges)
      ? storedChanges.filter((value): value is CartChange => {
          if (!value || typeof value !== "object") return false;
          const change = value as Partial<CartChange>;
          return typeof change.sku === "string" && typeof change.nameSl === "string" &&
            ["price", "quantity", "unavailable"].includes(change.kind ?? "") &&
            Number.isInteger(change.previousValue) && Number(change.previousValue) >= 0 &&
            Number.isInteger(change.nextValue) && Number(change.nextValue) >= 0;
        }).slice(0, 300)
      : [];
    return { lines, changes };
  } catch {
    return empty;
  }
}

export function parseStoredCart(value: string | null): CartLine[] {
  return parseStoredCartState(value).lines;
}

export function reconcileCart(state: CartState, catalog: CartCatalogSnapshot): CartState {
  // An unavailable database must never be treated as an empty catalog.
  if (!catalog.verified) return state;
  const products = new Map(catalog.products.map((product) => [product.sku, product]));
  const changes = new Map((state.changes ?? []).map((change) => [
    `${change.sku}:${change.kind}`, change,
  ]));
  let updated = false;
  const addChange = (change: CartChange) => {
    const key = `${change.sku}:${change.kind}`;
    const previous = changes.get(key);
    changes.set(key, { ...change, previousValue: previous?.previousValue ?? change.previousValue });
  };
  const lines = state.lines.flatMap((line) => {
    const product = products.get(line.sku);
    if (!product || product.stockQuantity < 1 || product.unitPriceCents <= 0) {
      updated = true;
      addChange({ sku: line.sku, nameSl: line.nameSl, kind: "unavailable", previousValue: line.quantity, nextValue: 0 });
      return [];
    }
    const quantity = safeQuantity(line.quantity, product.stockQuantity);
    if (line.unitPriceCents !== product.unitPriceCents) {
      addChange({ sku: line.sku, nameSl: product.nameSl, kind: "price", previousValue: line.unitPriceCents, nextValue: product.unitPriceCents });
    }
    if (quantity !== line.quantity) {
      addChange({ sku: line.sku, nameSl: product.nameSl, kind: "quantity", previousValue: line.quantity, nextValue: quantity });
    }
    const matches = line.slug === product.slug && line.nameSl === product.nameSl &&
      line.unitPriceCents === product.unitPriceCents && line.stockQuantity === product.stockQuantity &&
      line.imageUrl === product.imageUrl && line.imageAltSl === product.imageAltSl && line.quantity === quantity;
    if (matches) return [line];
    updated = true;
    return [{ ...product, quantity }];
  });
  return updated ? { lines, changes: [...changes.values()] } : state;
}

export function cartMatchesCatalog(lines: CartLine[], catalog: CartCatalogSnapshot) {
  return catalog.verified && reconcileCart({ lines }, catalog).lines === lines;
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === "sync_catalog") return reconcileCart(state, action.catalog);
  if (action.type === "acknowledge_changes") return { ...state, changes: [] };
  if (action.type === "clear") return { lines: [], changes: [] };
  if (action.type === "replace") return { ...state, lines: action.lines };
  if (action.type === "remove") {
    return {
      lines: state.lines.filter((line) => line.sku !== action.sku),
      changes: state.changes?.filter((change) => change.sku !== action.sku),
    };
  }
  if (action.type === "set_quantity") {
    if (action.quantity <= 0) {
      return cartReducer(state, { type: "remove", sku: action.sku });
    }
    return {
      ...state,
      lines: state.lines.map((line) =>
        line.sku === action.sku
          ? { ...line, quantity: safeQuantity(action.quantity, line.stockQuantity) }
          : line,
      ),
    };
  }

  const existing = state.lines.find((line) => line.sku === action.product.sku);
  if (!existing) {
    return {
      ...state,
      lines: [
        ...state.lines,
        {
          ...action.product,
          quantity: safeQuantity(action.quantity, action.product.stockQuantity),
        },
      ],
    };
  }
  return {
    ...state,
    lines: state.lines.map((line) =>
      line.sku === action.product.sku
        ? {
            ...action.product,
            quantity: safeQuantity(
              line.quantity + action.quantity,
              action.product.stockQuantity,
            ),
          }
        : line,
    ),
  };
}

export function cartItemCount(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return calculateCartTotal(lines);
}
