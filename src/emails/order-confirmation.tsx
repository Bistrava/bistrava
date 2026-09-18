import {
  Button,
  Hr,
  Row,
  Section,
  Text,
} from "react-email";

import { EmailLayout } from "@/emails/_components/email-layout";
import { formatMoney } from "@/lib/commerce/money";
import type { OrderConfirmationEmailData } from "@/lib/validation/email";

export default function OrderConfirmationEmail({
  customerName,
  orderReference,
  orderUrl,
  totalCents,
  items,
}: OrderConfirmationEmailData) {
  return (
    <EmailLayout
      preview={`Potrditev naročila ${orderReference}`}
      title="Hvala za vaše naročilo."
    >
      <Text style={styles.text}>Pozdravljeni, {customerName}.</Text>
      <Text style={styles.text}>
        Naročilo <strong>{orderReference}</strong> smo prejeli. Ko bo plačilo
        varno potrjeno in naročilo pripravljeno, boste prejeli novo sporočilo.
      </Text>

      <Section style={styles.orderBox}>
        {items.map((item) => (
          <Row key={`${item.name}-${item.quantity}`} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.quantity} × {item.name}
            </Text>
            <Text style={styles.itemPrice}>{formatMoney(item.lineTotalCents)}</Text>
          </Row>
        ))}
        <Hr style={styles.hr} />
        <Row>
          <Text style={styles.totalLabel}>Skupaj</Text>
          <Text style={styles.total}>{formatMoney(totalCents)}</Text>
        </Row>
      </Section>

      <Button href={orderUrl} style={styles.button}>
        Oglejte si naročilo
      </Button>
      <Text style={styles.smallText}>
        Če naročila niste oddali vi, odgovorite na to sporočilo. Ne pošiljajte
        plačilnih podatkov po e-pošti.
      </Text>
    </EmailLayout>
  );
}

OrderConfirmationEmail.PreviewProps = {
  customerName: "Maja Novak",
  orderReference: "BIS-DEMO-1001",
  orderUrl: "https://bistrava.com/narocilo/BIS-DEMO-1001",
  totalCents: 78290,
  items: [
    {
      name: "Predstavitveni hišni filter H3",
      quantity: 1,
      lineTotalCents: 74900,
    },
    { name: "Predstavitveni vložek", quantity: 1, lineTotalCents: 3390 },
  ],
} satisfies OrderConfirmationEmailData;

const styles = {
  text: { color: "#263640", fontSize: "16px", lineHeight: "26px" },
  orderBox: {
    backgroundColor: "#EAF5F6",
    borderRadius: "12px",
    margin: "26px 0",
    padding: "18px 20px",
  },
  itemRow: { borderBottom: "1px solid #CFE2E5" },
  itemName: { color: "#263640", fontSize: "14px", margin: "10px 0" },
  itemPrice: {
    color: "#10324A",
    fontSize: "14px",
    fontWeight: 700,
    margin: "10px 0",
    textAlign: "right" as const,
  },
  hr: { borderColor: "#CFE2E5", margin: "12px 0" },
  totalLabel: { color: "#10324A", fontWeight: 700, margin: 0 },
  total: {
    color: "#10324A",
    fontSize: "20px",
    fontWeight: 800,
    margin: 0,
    textAlign: "right" as const,
  },
  button: {
    backgroundColor: "#10324A",
    borderRadius: "8px",
    color: "#FFFFFF",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 700,
    padding: "13px 20px",
  },
  smallText: {
    color: "#647780",
    fontSize: "12px",
    lineHeight: "19px",
    marginTop: "24px",
  },
};
