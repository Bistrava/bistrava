"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/components/cart/cart-provider";

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link className="header-cart-link" href="/kosarica" aria-label={`Košarica, ${itemCount} izdelkov`}>
      <ShoppingBag aria-hidden="true" size={22} />
      <span>Košarica</span>
      <b aria-hidden="true">{itemCount}</b>
    </Link>
  );
}

