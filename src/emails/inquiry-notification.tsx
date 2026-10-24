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
      {[["Vrsta", type], ["Ime", name], ["E-pošta", email], ["Telefon", phone || "ni naveden"]].map(([label, value]) => (
        <Text key={label} style={styles.detail}><span style={styles.detailLabel}>{label}</span><br />{value}</Text>
      ))}
    </Section>
    <Text style={styles.label}>Sporočilo stranke</Text>
    <Text style={styles.message}>{message}</Text>
  </EmailLayout>;
}

const styles = {
  text: { color: "#263640", fontSize: "15px", lineHeight: "25px" },
  details: { backgroundColor: "#EAF5F6", borderRadius: "10px", padding: "14px", margin: "22px 0", overflowWrap: "anywhere" as const },
  reference: { color: "#148F83", fontSize: "12px", lineHeight: "20px", overflowWrap: "anywhere" as const, margin: "0 0 4px" },
  detail: { color: "#10324A", fontSize: "15px", lineHeight: "22px", fontWeight: 600, overflowWrap: "anywhere" as const, margin: "8px 0 0" },
  detailLabel: { color: "#647780", fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" as const },
  label: { color: "#10324A", fontSize: "17px", fontWeight: 700 },
  message: { color: "#263640", fontSize: "15px", lineHeight: "25px", whiteSpace: "pre-wrap" as const, overflowWrap: "anywhere" as const },
};
