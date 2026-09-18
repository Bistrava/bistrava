import { LegalPage } from "@/components/store/legal-page";
import { legalMetadata } from "@/lib/content/legal-pages";
export const metadata = legalMetadata("pravna-obvestila");
export default function Page() { return <LegalPage pageKey="pravna-obvestila" />; }
