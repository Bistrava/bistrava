import { SpecialistPage } from "@/components/store/specialist-page";
import { specialistMetadata, specialistPages } from "@/lib/content/specialist-pages";

export const metadata = specialistMetadata("mehcalne-naprave");

export default function Page() {
  return <SpecialistPage page={specialistPages["mehcalne-naprave"]} />;
}
