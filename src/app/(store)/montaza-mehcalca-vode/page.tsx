import { SpecialistPage } from "@/components/store/specialist-page";
import { specialistMetadata, specialistPages } from "@/lib/content/specialist-pages";

export const metadata = specialistMetadata("montaza-mehcalca-vode");

export default function Page() {
  return <SpecialistPage page={specialistPages["montaza-mehcalca-vode"]} />;
}
