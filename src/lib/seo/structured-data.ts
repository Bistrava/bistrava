import { absoluteUrl, siteConfig } from "@/lib/seo/site";
import type { Guide } from "@/lib/content/guides";
import type { CatalogProduct } from "@/types/catalog";
import { companyDetails } from "@/lib/content/company";
import type { ProductDeliveryEstimate } from "@/lib/content/delivery";
import { getMerchantIdentity } from "@/lib/catalog/merchant";

export type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    legalName: companyDetails.fullName,
    alternateName: companyDetails.shortName,
    taxID: companyDetails.taxNumber,
    vatID: companyDetails.vatNumber,
    identifier: {
      "@type": "PropertyValue",
      propertyID: "Matična številka",
      value: companyDetails.registrationNumber,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: companyDetails.registeredOffice.streetAddress,
      postalCode: companyDetails.registeredOffice.postalCode,
      addressLocality: companyDetails.registeredOffice.addressLocality,
      addressCountry: companyDetails.registeredOffice.addressCountry,
    },
    email: companyDetails.email,
    telephone: companyDetails.phone,
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

export function productSchema(product: CatalogProduct, delivery?: ProductDeliveryEstimate): Record<string, unknown> {
  const identity = getMerchantIdentity(product);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameSl,
    description: product.shortDescriptionSl,
    sku: product.sku,
    url: absoluteUrl(product.canonical),
  };
  if (identity.brand) schema.brand = { "@type": "Brand", name: identity.brand };
  if (identity.gtin) schema.gtin = identity.gtin;
  if (identity.mpn) schema.mpn = identity.mpn;

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
      url: absoluteUrl(product.canonical),
      priceCurrency: product.currency,
      price: (product.priceCents / 100).toFixed(2),
      availability,
      itemCondition: "https://schema.org/NewCondition",
      ...(delivery?.rate ? {
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: (delivery.rate.priceCents / 100).toFixed(2), currency: product.currency },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "SI" },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: delivery.handlingDaysMin, maxValue: delivery.handlingDaysMax, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: delivery.transitDaysMin, maxValue: delivery.transitDaysMax, unitCode: "DAY" },
          },
        },
      } : {}),
    };
  }

  return schema;
}
