import { Section, Text } from "react-email";
import { EmailLayout } from "@/emails/_components/email-layout";

type InquiryNotificationEmailProps = {
  requestId: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
};

export default function InquiryNotificationEmail({ requestId, type, name, email, phone, message }: InquiryNotificationEmailProps) {
  return <EmailLayout preview={`Novo povpraševanje Bistrava — ${name}`} title="Novo povpraševanje stranke">
    <Text style={styles.text}>Prejeli ste novo sporočilo prek spletnega mesta Bistrava. Za odgovor stranki odgovorite neposredno na to e-sporočilo.</Text>
    <Section className="email-panel" style={styles.details}>
      <Text style={styles.reference}>Referenca: {requestId}</Text>
      <Text style={styles.text}><strong>Vrsta:</strong> {type}<br /><strong>Ime:</strong> {name}<br /><strong>E-pošta:</strong> {email}<br /><strong>Telefon:</strong> {phone || "ni naveden"}</Text>
    </Section>
    <Text style={styles.label}>Sporočilo stranke</Text>
    <Text style={styles.message}>{message}</Text>
  </EmailLayout>;
}

const styles = {
  text: { color: "#263640", fontSize: "15px", lineHeight: "25px" },
  details: { backgroundColor: "#EAF5F6", borderRadius: "12px", padding: "20px", margin: "24px 0", overflowWrap: "anywhere" as const },
  reference: { color: "#148F83", fontSize: "12px", lineHeight: "20px", margin: "0 0 12px" },
  label: { color: "#10324A", fontSize: "17px", fontWeight: 700 },
  message: { color: "#263640", fontSize: "15px", lineHeight: "25px", whiteSpace: "pre-wrap" as const, overflowWrap: "anywhere" as const },
};
