import { LegalPage } from "@/components/store/legal-page";
import { legalMetadata } from "@/lib/content/legal-pages";
export const metadata = legalMetadata("garancija");
export default function Page() { return <LegalPage pageKey="garancija" />; }
