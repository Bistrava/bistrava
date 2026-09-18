import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart/cart-page-client";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "Košarica",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: "Košarica", href: "/kosarica" }]} />
      </div>
      <section className="section utility-page">
        <div className="container">
          <CartPageClient />
        </div>
      </section>
    </>
  );
}
