import { SpecialistPage } from "@/components/store/specialist-page";
import { specialistMetadata, specialistPages } from "@/lib/content/specialist-pages";

export const metadata = specialistMetadata("servis-mehcalnih-naprav");

export default function Page() {
  return <SpecialistPage page={specialistPages["servis-mehcalnih-naprav"]} />;
}
