import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getCheckoutConfig } from "@/lib/commerce/config";
import { getActiveShippingRates } from "@/lib/commerce/shipping";

export const metadata: Metadata = {
  title: "Blagajna",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [rates, checkoutConfig] = await Promise.all([
    getActiveShippingRates(),
    Promise.resolve(getCheckoutConfig()),
  ]);

  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: "Košarica", href: "/kosarica" }, { label: "Blagajna", href: "/blagajna" }]} />
      </div>
      <section className="checkout-hero">
        <div className="container">
          <p className="section-kicker">Varna blagajna</p>
          <h1>Zaključite naročilo</h1>
          <p>Vnesite kontaktne podatke in naslov. Končne vrednosti vedno preveri strežnik.</p>
        </div>
      </section>
      <section className="section checkout-page">
        <div className="container">
          <CheckoutForm rates={rates} orderingEnabled={checkoutConfig.enabled} />
        </div>
      </section>
    </>
  );
}
