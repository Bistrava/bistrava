import type { Metadata } from "next";

import { SoftenerConfigurator } from "@/components/configurator/softener-configurator";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { specialistProducts } from "@/lib/catalog/catalog";
import { getActiveCatalogProducts } from "@/lib/catalog/repository";
import type { ConfiguratorProduct } from "@/lib/configurator/recommendation-engine";

export const metadata: Metadata = {
  title: "Izbira mehčalca vode",
  description:
    "Konfigurator za izbiro profila mehčalca glede na trdoto vode, gospodinjstvo, porabo in pogoje montaže.",
  alternates: { canonical: "/izbira-mehcalca" },
};

export default async function SoftenerChoicePage() {
  const activeCatalogProducts = await getActiveCatalogProducts();
  const catalogProducts = activeCatalogProducts.length > 0
    ? activeCatalogProducts
    : specialistProducts;
  const products: ConfiguratorProduct[] = catalogProducts
    .filter((product) => product.categorySlug === "mehcalci-vode")
    .flatMap((product) => {
      const unitPriceCents = product.priceCents ?? product.supplierPriceCents;
      if (unitPriceCents === null) return [];
      return [{
        sku: product.sku,
        slug: product.slug,
        nameSl: product.nameSl,
        brand: product.brand,
        shortDescriptionSl: product.shortDescriptionSl,
        unitPriceCents,
        imageUrl: product.images[0]?.url ?? null,
        imageAltSl: product.images[0]?.altSl ?? product.nameSl,
        stockQuantity: Math.max(product.stockQuantity, 1),
        householdSizeMin: product.householdSizeMin,
        householdSizeMax: product.householdSizeMax,
        resinVolumeLiters: product.resinVolumeLiters,
        maxFlowLitersPerMinute: product.maxFlowLitersPerMinute,
        connectionSize: product.connectionSize,
        dimensions: product.dimensions,
        installationRequired: product.installationRequired,
      }];
    });

  return (
    <>
      <div className="container"><Breadcrumbs items={[{ label: "Izbira mehčalca", href: "/izbira-mehcalca" }]} /></div>
      <section className="info-hero configurator-hero">
        <div className="container">
          <p className="section-kicker">Vodena izbira brez ugibanja</p>
          <h1>Izberite pravi mehčalec vode</h1>
          <p>
            Vnesite podatke v treh kratkih korakih. Primerjali bomo dejanske izdelke
            iz trgovine ter prikazali tri najprimernejše modele z razlogi za izbiro.
          </p>
        </div>
      </section>
      <section className="section configurator-section">
        <div className="container"><SoftenerConfigurator products={products} /></div>
      </section>
    </>
  );
}
