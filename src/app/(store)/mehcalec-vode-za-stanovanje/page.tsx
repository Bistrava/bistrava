import { SpecialistPage } from "@/components/store/specialist-page";
import { specialistMetadata, specialistPages } from "@/lib/content/specialist-pages";

export const metadata = specialistMetadata("mehcalec-vode-za-stanovanje");

export default function Page() {
  return <SpecialistPage page={specialistPages["mehcalec-vode-za-stanovanje"]} />;
}
