import { SpecialistPage } from "@/components/store/specialist-page";
import { specialistMetadata, specialistPages } from "@/lib/content/specialist-pages";

export const metadata = specialistMetadata("sol-za-mehcalec-vode");

export default function Page() {
  return <SpecialistPage page={specialistPages["sol-za-mehcalec-vode"]} />;
}
