import type { Metadata } from "next";
import { Check, FileText, Info, PackageCheck, ShieldCheck, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/cart/add-to-cart";
import { CatalogProductCard } from "@/components/product/catalog-product-card";
import { CatalogProductVisual } from "@/components/product/catalog-product-visual";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import {
  catalogProducts,
  getCatalogProduct,
  getCatalogCategory,
  getCategoryDetails,
  getProductsByCategory,
} from "@/lib/catalog/catalog";
import { getActiveCatalogProduct } from "@/lib/catalog/repository";
import { JsonLd } from "@/components/seo/json-ld";
import { productSchema } from "@/lib/seo/structured-data";

type ProductPageProps = { params: Promise<{ slug: string }> };

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

function formatSupplierPrice(
  priceCents: number,
  maxPriceCents: number | null,
) {
  if (maxPriceCents !== null && maxPriceCents !== priceCents) {
    return `${formatPrice(priceCents)}–${formatPrice(maxPriceCents)}`;
  }
  return formatPrice(priceCents);
}

function formatObservedDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${Number(day)}. ${Number(month)}. ${year}`;
}

const stockLabels = {
  in_stock: "Na zalogi",
  out_of_stock: "Ni na zalogi",
  backorder: "Po naročilu",
  unverified: "Še ni potrjena",
} as const;

export function generateStaticParams() {
  return catalogProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getActiveCatalogProduct(slug)) ?? getCatalogProduct(slug);
  if (!product) return {};

  return {
    title: { absolute: product.seoTitle },
    description: product.seoDescriptionSl,
    alternates: { canonical: product.canonical },
    robots:
      product.status === "active"
        ? { index: true, follow: true }
        : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "sl_SI",
      url: product.canonical,
      siteName: "Bistrava",
      title: product.seoTitle,
      description: product.seoDescriptionSl,
      images: product.images.map((image) => image.url),
    },
    twitter: {
      card: product.images.length > 0 ? "summary_large_image" : "summary",
      title: product.seoTitle,
      description: product.seoDescriptionSl,
      images: product.images.map((image) => image.url),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = (await getActiveCatalogProduct(slug)) ?? getCatalogProduct(slug);
  if (!product) notFound();

  const category = getCatalogCategory(product.categorySlug);
  if (!category) notFound();
  const details = getCategoryDetails(product.categorySlug);
  const relatedProducts = getProductsByCategory(product.categorySlug)
    .filter((candidate) => candidate.slug !== product.slug)
    .slice(0, 3);

  return (
    <>
      {product.status === "active" ? <JsonLd data={productSchema(product)} /> : null}
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Mehčalci vode", href: "/mehcalci-vode" },
            { label: category.name, href: `/mehcalci-vode#${category.slug}` },
            { label: product.nameSl, href: product.canonical },
          ]}
        />
      </div>

      <section className="product-detail-top">
        <div className="container product-detail-grid">
          {product.images.length > 0 ? (
            <div className="product-gallery" aria-label={`Galerija izdelka ${product.nameSl}`}>
              {product.images.slice(0, 4).map((image, index) => (
                <figure
                  className={`product-media card${index === 0 ? " product-media-primary" : ""}`}
                  key={image.url}
                >
                  <div className="product-media-frame">
                    <Image
                      src={image.url}
                      alt={image.altSl}
                      fill
                      sizes={index === 0
                        ? "(max-width: 900px) 100vw, 50vw"
                        : "(max-width: 640px) 50vw, 25vw"}
                      preload={index === 0}
                    />
                  </div>
                  <figcaption>
                    {image.kind === "information"
                      ? "Informativni prikaz Bistrava"
                      : `Fotografija vira: ${image.sourceName ?? product.supplierPriceSourceName ?? "dobavitelj"}`}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <CatalogProductVisual categorySlug={product.categorySlug} productName={product.nameSl} />
          )}
          <div className="product-summary">
            <span className="eyebrow">
              {product.status === "active" ? "Na voljo za nakup" : "Izdelek v katalogu"}
            </span>
            <p className="product-brand">{product.brand}</p>
            <h1>{product.nameSl}</h1>
            <p className="product-short-description">{product.shortDescriptionSl}</p>
            {product.status !== "active" ? (
              <div className="demo-warning">
                <Info aria-hidden="true" size={20} />
                <p>
                  Fotografije, tehnične podatke in informativno ceno smo povzeli iz
                  navedenega vira. Spletni nakup tega izdelka bo omogočen po potrditvi
                  prodajne cene, zaloge in garancijskih pogojev Bistrava.
                </p>
              </div>
            ) : null}
            <div className="product-price-block">
              <span>{product.status === "active" ? "Cena" : "Javno objavljena cena pri viru"}</span>
              <strong>
                {product.status === "active" && product.priceCents !== null
                  ? formatPrice(product.priceCents)
                  : product.status === "active"
                    ? "Po povpraševanju"
                    : product.supplierPriceCents !== null
                      ? formatSupplierPrice(
                          product.supplierPriceCents,
                          product.supplierPriceMaxCents,
                        )
                      : "Ni potrjena"}
              </strong>
              <small>
                {product.status === "active"
                  ? product.salesMode === "buy_now"
                    ? `Cena vključuje ${product.vatRate}% DDV.`
                    : "Končna cena je odvisna od potrjenega obsega ponudbe."
                  : product.supplierPriceCents !== null
                    ? `${product.supplierPriceNoteSl} ${product.supplierPriceIncludesVat ? "Vključuje DDV. " : ""}Preverjeno ${formatObservedDate(product.supplierPriceObservedAt!)}.`
                    : "Čaka na identifikacijo točnega modela in veljaven vir cene."}
              </small>
              {product.status !== "active" && product.supplierPriceSourceUrl ? (
                <a
                  className="supplier-price-source"
                  href={product.supplierPriceSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Preverite trenutno ceno pri {product.supplierPriceSourceName}
                </a>
              ) : null}
            </div>
            {product.status === "active" &&
            product.salesMode === "buy_now" &&
            product.priceCents !== null &&
            product.stockStatus === "in_stock" &&
            product.stockQuantity > 0 ? (
              <AddToCart
                product={{
                  sku: product.sku,
                  slug: product.slug,
                  nameSl: product.nameSl,
                  unitPriceCents: product.priceCents,
                  imageUrl: product.images[0]?.url ?? null,
                  imageAltSl: product.images[0]?.altSl ?? product.nameSl,
                  stockQuantity: product.stockQuantity,
                }}
              />
            ) : (
              <Link className="button button-primary" href="/mehcalci-vode#katalog">
                Nadaljujte z nakupovanjem
              </Link>
            )}
            <dl className="product-quick-facts">
              <div><dt>SKU</dt><dd>{product.sku}</dd></div>
              <div><dt>Kategorija</dt><dd>{category.name}</dd></div>
              <div><dt>Javna zaloga</dt><dd>{stockLabels[product.stockStatus]}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section product-benefits-section">
        <div className="container product-benefit-grid">
          <div>
            <p className="section-kicker">Velika opisna vsebina</p>
            <h2>Opis in namen izdelka</h2>
            <div className="product-long-description">
              {product.descriptionSl.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <ul>
            {product.highlightsSl.map((highlight) => (
              <li key={highlight}><Check aria-hidden="true" size={20} /> {highlight}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section product-spec-section">
        <div className="container spec-grid">
          <div>
            <p className="section-kicker">Značilnosti</p>
            <h2>Tehnične karakteristike</h2>
            <p className="section-intro">
              Podatki so povzeti iz javne produktne strani dobavitelja. Pred montažo je
              treba preveriti izbrano različico, dejanske pogoje na objektu in najnovejša navodila.
            </p>
            {product.supplierPriceSourceUrl ? (
              <a
                className="supplier-price-source"
                href={product.supplierPriceSourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Tehnični vir: {product.supplierPriceSourceName}
              </a>
            ) : null}
          </div>
          <dl className="spec-table card">
            <div><dt>Znamka</dt><dd>{product.brand}</dd></div>
            <div><dt>Tehnologija</dt><dd>{product.technology}</dd></div>
            {product.technicalSpecifications.map((specification) => (
              <div key={`${specification.labelSl}-${specification.valueSl}`}>
                <dt>{specification.labelSl}</dt>
                <dd>{specification.valueSl}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section product-care-section">
        <div className="container product-care-grid">
          <article className="card"><Wrench aria-hidden="true" /><h3>Montaža</h3><p>{details.installation}</p></article>
          <article className="card"><PackageCheck aria-hidden="true" /><h3>Vzdrževanje</h3><p>Upoštevajte intervale čiščenja, menjave ali regeneracije, ki veljajo za konkretni model.</p></article>
          <article className="card"><ShieldCheck aria-hidden="true" /><h3>Združljivost</h3><p>Pred naročilom preverite priključek, tlak, pretok in prostorske pogoje na objektu.</p></article>
          <article className="card"><FileText aria-hidden="true" /><h3>Vir podatkov</h3><p>Lastnosti in javna cena so sledljive do navedene produktne strani dobavitelja.</p></article>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="section related-products-section">
          <div className="container">
            <div className="category-results-heading">
              <div><p className="section-kicker">Primerjajte izdelke</p><h2>Drugi izdelki v isti skupini</h2></div>
              <Link className="button button-secondary" href="/mehcalci-vode#katalog">Celoten katalog</Link>
            </div>
            <div className="catalog-product-grid">
              {relatedProducts.map((relatedProduct) => <CatalogProductCard key={relatedProduct.id} product={relatedProduct} />)}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
