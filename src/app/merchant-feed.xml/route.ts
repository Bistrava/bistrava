import { getMerchantEligibleProducts } from "@/lib/catalog/catalog";
import { getActiveCatalogProducts } from "@/lib/catalog/repository";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const eligibleProducts = getMerchantEligibleProducts(
    await getActiveCatalogProducts(),
  );
  const items = eligibleProducts
    .map((product) => {
      const price = `${(product.priceCents! / 100).toFixed(2)} EUR`;
      return `<item>
        <g:id>${escapeXml(product.sku)}</g:id>
        <title>${escapeXml(product.nameSl)}</title>
        <description>${escapeXml(product.shortDescriptionSl)}</description>
        <link>${escapeXml(absoluteUrl(product.canonical))}</link>
        <g:image_link>${escapeXml(absoluteUrl(product.images[0]!.url))}</g:image_link>
        <g:availability>in_stock</g:availability>
        <g:price>${price}</g:price>
        <g:condition>new</g:condition>
        <g:brand>${escapeXml(product.brand)}</g:brand>
      </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
      <title>Bistrava</title>
      <link>${absoluteUrl("/")}</link>
      <description>Preverjeni aktivni izdelki Bistrava</description>
      ${items}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
