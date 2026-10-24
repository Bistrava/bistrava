import { getMerchantEligibleProducts } from "@/lib/catalog/catalog";
import { buildMerchantFeed } from "@/lib/catalog/merchant-feed";
import { getActiveCatalogProducts } from "@/lib/catalog/repository";
import { getActiveShippingRates } from "@/lib/commerce/shipping";

export const dynamic = "force-dynamic";

export async function GET() {
  const [products, rates] = await Promise.all([getActiveCatalogProducts(), getActiveShippingRates()]);
  return new Response(buildMerchantFeed(getMerchantEligibleProducts(products), rates), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
