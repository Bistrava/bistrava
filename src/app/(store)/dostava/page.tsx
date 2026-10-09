import { LegalPage } from "@/components/store/legal-page";
import "@/components/store/delivery-page.css";
import { legalMetadata } from "@/lib/content/legal-pages";
import { createDeliveryPageContent } from "@/lib/content/delivery";
import { getActiveShippingRates } from "@/lib/commerce/shipping";
export const metadata = {
  ...legalMetadata("dostava"),
  title: "Dostava po Sloveniji",
  description: "Preverite stroške dostave Bistrava po Sloveniji, pogoje brezplačne dostave, dobavne roke, sledenje pošiljki in pomoč pri prevzemu.",
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";
export default async function Page() {
  const rates = await getActiveShippingRates();
  return <LegalPage pageKey="dostava" content={createDeliveryPageContent(rates)} />;
}
