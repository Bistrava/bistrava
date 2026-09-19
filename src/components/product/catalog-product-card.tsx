import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { QuickAddToCart } from "@/components/cart/add-to-cart";
import { CatalogProductVisual } from "@/components/product/catalog-product-visual";
import { formatMoney } from "@/lib/commerce/money";
import type { CatalogProduct } from "@/types/catalog";

export function CatalogProductCard({ product }: { product: CatalogProduct }) {
  const isPreparing = product.status !== "active";

  return (
    <article className="catalog-product-card card">
      {product.images[0] ? (
        <Link
          aria-label={`Odprite izdelek ${product.nameSl}`}
          className="catalog-product-card-media"
          href={`/izdelki/${product.slug}`}
        >
          <Image
            src={product.images[0].url}
            alt={product.images[0].altSl}
            fill
            sizes="(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 33vw"
          />
        </Link>
      ) : (
        <CatalogProductVisual
          categorySlug={product.categorySlug}
          productName={product.nameSl}
          compact
        />
      )}
      <div className="catalog-product-card-content">
        <div className="catalog-product-card-topline">
          <span className="eyebrow">
            {isPreparing
              ? "V pripravi - ni v prodaji"
              : product.stockStatus === "in_stock"
                ? "Aktivna ponudba"
                : "Dobavljivost po preverbi"}
          </span>
          <span>{product.sku}</span>
        </div>
        <p className="product-card-brand">{product.brand}</p>
        <h3>
          <Link href={`/izdelki/${product.slug}`}>{product.nameSl}</Link>
        </h3>
        <p>{product.shortDescriptionSl}</p>
        {product.status === "active" && product.priceCents !== null ? (
          <strong className="product-card-price">{formatMoney(product.priceCents)}</strong>
        ) : null}
        <div className="catalog-product-card-actions">
          <Link className="catalog-product-card-link" href={`/izdelki/${product.slug}`}>
            Odprite produktno kartico
            <ArrowUpRight aria-hidden="true" size={17} />
          </Link>
          {product.status === "active" &&
          product.salesMode === "buy_now" &&
          product.priceCents !== null &&
          product.stockStatus === "in_stock" &&
          product.stockQuantity > 0 ? (
            <QuickAddToCart
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
          ) : null}
        </div>
      </div>
    </article>
  );
}
