import { LegalPage } from "@/components/store/legal-page";
import { legalMetadata } from "@/lib/content/legal-pages";
import { createDeliveryPageContent } from "@/lib/content/delivery";
import { getActiveShippingRates } from "@/lib/commerce/shipping";
export const metadata = legalMetadata("dostava");
export const dynamic = "force-dynamic";
export default async function Page() {
  const rates = await getActiveShippingRates();
  return <LegalPage pageKey="dostava" content={createDeliveryPageContent(rates)} />;
}
