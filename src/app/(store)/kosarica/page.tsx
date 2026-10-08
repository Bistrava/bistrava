import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart/cart-page-client";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getCartCatalogSnapshot } from "@/lib/cart/server";

export const metadata: Metadata = {
  title: "Košarica",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const catalog = await getCartCatalogSnapshot();
  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: "Košarica", href: "/kosarica" }]} />
      </div>
      <section className="section utility-page">
        <div className="container">
          <CartPageClient catalog={catalog} />
        </div>
      </section>
    </>
  );
}
