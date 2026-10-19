import { Section, Text } from "react-email";

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
      <Section className="email-panel" style={styles.messageBox}>
        <Text style={styles.reference}>Referenca: {requestId}</Text>
        <Text style={styles.label}>Vaše sporočilo</Text>
        <Text style={styles.message}>{message}</Text>
      </Section>
    </EmailLayout>
  );
}

const styles = {
  messageBox: { backgroundColor: "#EAF5F6", borderRadius: "12px", padding: "20px", margin: "24px 0" },
  reference: { color: "#148F83", fontSize: "12px", lineHeight: "20px", overflowWrap: "anywhere" as const, margin: "0 0 14px" },
  label: { color: "#10324A", fontSize: "16px", fontWeight: 700, margin: "0 0 8px" },
  message: { color: "#263640", fontSize: "15px", lineHeight: "25px", whiteSpace: "pre-wrap" as const, overflowWrap: "anywhere" as const, margin: 0 },
};
