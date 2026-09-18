"use client";

import { Check, ShoppingBag } from "lucide-react";
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

export function AddToCart({ product }: { product: CartProductSnapshot }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product, quantity);
    trackAddToCart(product, quantity);
    setAdded(true);
  };

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
            setAdded(false);
          }}
        />
        <button className="button button-primary" type="button" onClick={handleAdd}>
          {added ? <Check aria-hidden="true" size={19} /> : <ShoppingBag aria-hidden="true" size={19} />}
          {added ? "Dodano v košarico" : "Dodaj v košarico"}
        </button>
      </div>
      <p aria-live="polite">{added ? `${quantity} × ${product.nameSl} je v košarici.` : ""}</p>
    </div>
  );
}

export function QuickAddToCart({ product }: { product: CartProductSnapshot }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      className="button button-secondary quick-add-to-cart"
      type="button"
      onClick={() => {
        addItem(product, 1);
        trackAddToCart(product, 1);
        setAdded(true);
      }}
    >
      {added ? <Check aria-hidden="true" size={17} /> : <ShoppingBag aria-hidden="true" size={17} />}
      {added ? "Dodano" : "V košarico"}
    </button>
  );
}
