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
};

export type CartAction =
  | { type: "replace"; lines: CartLine[] }
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

export function parseStoredCart(value: string | null): CartLine[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isCartLine)
      .map((line) => ({
        ...line,
        quantity: safeQuantity(line.quantity, line.stockQuantity),
      }))
      .slice(0, 100);
  } catch {
    return [];
  }
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === "clear") return { lines: [] };
  if (action.type === "replace") return { lines: action.lines };
  if (action.type === "remove") {
    return { lines: state.lines.filter((line) => line.sku !== action.sku) };
  }
  if (action.type === "set_quantity") {
    if (action.quantity <= 0) {
      return { lines: state.lines.filter((line) => line.sku !== action.sku) };
    }
    return {
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

