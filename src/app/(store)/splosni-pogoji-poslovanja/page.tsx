import { LegalPage } from "@/components/store/legal-page";
import { legalMetadata } from "@/lib/content/legal-pages";

export const metadata = legalMetadata("splosni-pogoji-poslovanja");

export default function TermsPage() {
  return <LegalPage pageKey="splosni-pogoji-poslovanja" />;
}
