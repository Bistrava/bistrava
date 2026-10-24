"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import type { CartProductSnapshot } from "@/lib/cart/cart";

function trackAddToCart(product: CartProductSnapshot, quantity: number) {
  const browser = window as typeof window & { dataLayer?: unknown[] };
  browser.dataLayer = browser.dataLayer || [];
  browser.dataLayer.push({
    event: "add_to_cart",
    ecommerce: {
      currency: "EUR",
      value: (product.unitPriceCents * quantity) / 100,
      items: [{
        item_id: product.sku,
        item_name: product.nameSl,
        price: product.unitPriceCents / 100,
        quantity,
      }],
    },
  });
}

// Adding leads straight to the cart, where the visitor continues shopping or checks out.
// The button content stays unchanged so translated pages are not re-rendered under the browser.
function useAddAndOpenCart() {
  const { addItem } = useCart();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const add = (product: CartProductSnapshot, quantity: number) => {
    addItem(product, quantity);
    trackAddToCart(product, quantity);
    setAdding(true);
    router.push("/kosarica");
  };
  return { add, adding };
}

export function AddToCart({ product }: { product: CartProductSnapshot }) {
  const { add, adding } = useAddAndOpenCart();
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="add-to-cart">
      <label htmlFor={`quantity-${product.sku}`}>Količina</label>
      <div>
        <input
          id={`quantity-${product.sku}`}
          type="number"
          min="1"
          max={Math.min(product.stockQuantity, 99)}
          inputMode="numeric"
          value={quantity}
          onChange={(event) => {
            const next = Number(event.target.value);
            setQuantity(Number.isFinite(next) ? Math.max(1, Math.min(next, product.stockQuantity)) : 1);
          }}
        />
        <button className="button button-primary" type="button" disabled={adding} aria-busy={adding} onClick={() => add(product, quantity)}>
          <ShoppingBag aria-hidden="true" size={19} />
          Dodaj v košarico
        </button>
      </div>
    </div>
  );
}

export function QuickAddToCart({ product }: { product: CartProductSnapshot }) {
  const { add, adding } = useAddAndOpenCart();

  return (
    <button
      className="button button-secondary quick-add-to-cart"
      type="button"
      disabled={adding}
      aria-busy={adding}
      onClick={() => add(product, 1)}
    >
      <ShoppingBag aria-hidden="true" size={17} />
      V košarico
    </button>
  );
}
