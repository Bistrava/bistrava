import { getCatalogCategory } from "@/lib/catalog/catalog";
import { getMerchantIdentity } from "@/lib/catalog/merchant";
import type { ShippingRate } from "@/lib/commerce/shipping-rates";
import { productDeliveryEstimate } from "@/lib/content/delivery";
import { absoluteUrl } from "@/lib/seo/site";
import type { CatalogProduct } from "@/types/catalog";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function limit(value: string, maximum: number) {
  const text = value.trim();
  return text.length <= maximum ? text : `${text.slice(0, maximum - 1).trimEnd()}…`;
}

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} EUR`;
}

function element(name: string, value: string | number) {
  return `<${name}>${escapeXml(String(value))}</${name}>`;
}

// Information panels carry text overlays, which Google rejects as product photos.
function isProductPhoto(url: string) {
  return !/\/bistrava-panel-\d/.test(url);
}

function itemXml(product: CatalogProduct, rates: ShippingRate[]) {
  const identity = getMerchantIdentity(product);
  const category = getCatalogCategory(product.categorySlug);
  const photos = product.images.map((image) => absoluteUrl(image.url)).filter(isProductPhoto);
  const [imageLink, ...additionalImages] = photos.length > 0 ? photos : [absoluteUrl(product.images[0]!.url)];
  const onSale = product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents!;
  const delivery = productDeliveryEstimate(rates, product.priceCents);
  const lines = [
    element("g:id", product.sku),
    element("g:title", limit(product.nameSl, 150)),
    element("g:description", limit(product.descriptionSl || product.shortDescriptionSl, 5000)),
    element("g:link", absoluteUrl(product.canonical)),
    element("g:image_link", imageLink),
    ...additionalImages.slice(0, 10).map((url) => element("g:additional_image_link", url)),
    element("g:availability", "in_stock"),
    element("g:price", money(onSale ? product.compareAtPriceCents! : product.priceCents!)),
    ...(onSale ? [element("g:sale_price", money(product.priceCents!))] : []),
    element("g:condition", "new"),
    ...(identity.brand ? [element("g:brand", identity.brand)] : []),
    ...(identity.gtin ? [element("g:gtin", identity.gtin)] : []),
    ...(identity.mpn ? [element("g:mpn", identity.mpn)] : []),
    ...(identity.identifierExists === false ? [element("g:identifier_exists", "no")] : []),
    ...(identity.googleProductCategory ? [element("g:google_product_category", identity.googleProductCategory)] : []),
    ...(category ? [element("g:product_type", category.name)] : []),
    ...(delivery.rate ? [`<g:shipping>${[
      element("g:country", "SI"),
      element("g:service", delivery.rate.name),
      element("g:price", money(delivery.rate.priceCents)),
      element("g:min_handling_time", delivery.handlingDaysMin),
      element("g:max_handling_time", delivery.handlingDaysMax),
      element("g:min_transit_time", delivery.transitDaysMin),
      element("g:max_transit_time", delivery.transitDaysMax),
    ].join("")}</g:shipping>`] : []),
    ...(product.weightKg ? [element("g:shipping_weight", `${product.weightKg} kg`)] : []),
    ...product.highlightsSl.slice(0, 10).map((highlight) => element("g:product_highlight", limit(highlight, 150))),
    ...product.technicalSpecifications.slice(0, 30).map((specification) => `<g:product_detail>${[
      element("g:section_name", "Tehnične karakteristike"),
      element("g:attribute_name", limit(specification.labelSl, 140)),
      element("g:attribute_value", limit(specification.valueSl, 1000)),
    ].join("")}</g:product_detail>`),
  ];
  return `<item>\n      ${lines.join("\n      ")}\n    </item>`;
}

export function buildMerchantFeed(products: CatalogProduct[], rates: ShippingRate[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Bistrava</title>
    <link>${escapeXml(absoluteUrl("/"))}</link>
    <description>Preverjeni aktivni izdelki Bistrava</description>
    ${products.map((product) => itemXml(product, rates)).join("\n    ")}
  </channel>
</rss>`;
}
