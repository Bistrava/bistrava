"use client";

import { useEffect } from "react";

import { useCart } from "@/components/cart/cart-provider";

// After a bank-app (3-D Secure) redirect the checkout page could not clear the cart itself.
export function ClearCartOnArrival() {
  const { clearCart, hydrated } = useCart();
  useEffect(() => {
    if (hydrated) clearCart();
  }, [clearCart, hydrated]);
  return null;
}
