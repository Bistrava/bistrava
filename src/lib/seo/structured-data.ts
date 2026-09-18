import { absoluteUrl, siteConfig } from "@/lib/seo/site";
import type { Guide } from "@/lib/content/guides";
import type { CatalogProduct } from "@/types/catalog";

export type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/brand/bistrava-logo-web.png"),
  };
}

export function websiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: siteConfig.locale,
  };
}

export function breadcrumbSchema(
  items: Array<{ name: string; path: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleSchema(guide: Guide): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    inLanguage: siteConfig.locale,
    dateModified: guide.updatedAt,
    mainEntityOfPage: absoluteUrl(`/vodici/${guide.slug}`),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function faqSchema(
  questions: Array<{ question: string; answer: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function productSchema(product: CatalogProduct): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameSl,
    description: product.shortDescriptionSl,
    sku: product.sku,
    url: product.canonical,
    brand: { "@type": "Brand", name: product.brand },
  };

  if (product.images.length > 0) {
    schema.image = product.images.map((image) => image.url);
  }

  if (
    product.priceCents !== null &&
    product.salesMode === "buy_now" &&
    product.stockStatus !== "unverified"
  ) {
    const availability = {
      in_stock: "https://schema.org/InStock",
      out_of_stock: "https://schema.org/OutOfStock",
      backorder: "https://schema.org/BackOrder",
    }[product.stockStatus];
    schema.offers = {
      "@type": "Offer",
      url: product.canonical,
      priceCurrency: product.currency,
      price: (product.priceCents / 100).toFixed(2),
      availability,
      itemCondition: "https://schema.org/NewCondition",
    };
  }

  return schema;
}
