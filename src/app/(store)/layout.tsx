import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/cart-provider";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="site-shell">
        <Header />
        <main id="glavna-vsebina" className="page-main">
          {children}
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
