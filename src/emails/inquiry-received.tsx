import { Text } from "react-email";

import { EmailLayout } from "@/emails/_components/email-layout";

type InquiryReceivedEmailProps = {
  name: string;
  requestId: string;
  message: string;
};

export default function InquiryReceivedEmail({
  name,
  requestId,
  message,
}: InquiryReceivedEmailProps) {
  return (
    <EmailLayout
      preview="Kopija vašega povpraševanja Bistrava"
      title="Vaše povpraševanje smo prejeli"
    >
      <Text>Pozdravljeni, {name}.</Text>
      <Text>
        Spodaj je kopija podatkov, ki ste jih poslali Bistravi. To sporočilo ne
        pomeni potrditve cene, dobavljivosti ali termina.
      </Text>
      <Text><strong>Referenca:</strong> {requestId}</Text>
      <Text><strong>Vaše sporočilo:</strong></Text>
      <Text>{message}</Text>
    </EmailLayout>
  );
}
