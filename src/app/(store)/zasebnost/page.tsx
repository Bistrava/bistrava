import { LegalPage } from "@/components/store/legal-page";
import { legalMetadata } from "@/lib/content/legal-pages";
export const metadata = legalMetadata("zasebnost");
export default function Page() { return <LegalPage pageKey="zasebnost" />; }
