import { Button, Column, Hr, Link, Row, Section, Text } from "react-email";

import { EmailLayout } from "@/emails/_components/email-layout";
import { formatMoney } from "@/lib/commerce/money";
import { orderStatusCopy } from "@/lib/email/order-status-copy";
import type { OrderStatusEmailData } from "@/lib/validation/email";

// Same branded layout and panels as the order confirmation, one message per status change.
export default function OrderStatusUpdateEmail({
  customerName,
  orderReference,
  orderUrl,
  totalCents,
  items,
  status,
  shipment,
  paymentUrl,
}: OrderStatusEmailData) {
  const copy = orderStatusCopy(status, orderReference);
  return (
    <EmailLayout preview={`${copy.badge}: naročilo ${orderReference}`} title={copy.title}>
      <Text style={styles.reference}>NAROČILO {orderReference} · {copy.badge.toUpperCase()}</Text>
      <Text style={styles.text}>Pozdravljeni, {customerName}.</Text>
      <Text style={styles.text}>{copy.intro}</Text>

      {status === "shipped" && shipment ? (
        <Section className="email-panel" style={styles.highlightBox}>
          <Text style={styles.boxTitle}>Sledenje pošiljki</Text>
          <Text style={styles.detailLabel}>Prevoznik</Text>
          <Text style={styles.detailValueStrong}>{shipment.carrier}</Text>
          <Text style={styles.detailLabel}>Številka za sledenje</Text>
          <Text style={styles.detailValueStrong}>{shipment.trackingNumber}</Text>
          {shipment.trackingUrl ? (
            <Text style={styles.trackingLinkRow}>
              <Link href={shipment.trackingUrl} style={styles.trackingLink}>Sledite pošiljki</Link>
            </Text>
          ) : null}
        </Section>
      ) : null}

      <Section className="email-panel" style={status === "cancelled" ? styles.cancelBox : styles.highlightBox}>
        <Text style={styles.boxTitle}>Naslednji korak</Text>
        <Text style={styles.textTight}>{copy.next}</Text>
      </Section>

      <Section className="email-panel" style={styles.orderBox}>
        <Text style={styles.boxTitle}>Povzetek naročila</Text>
        {items.map((item, index) => (
          <Section key={`${item.name}-${index}`} style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              Količina: {item.quantity} · <strong style={styles.itemPrice}>{formatMoney(item.lineTotalCents)}</strong>
            </Text>
          </Section>
        ))}
        <Hr style={styles.hr} />
        <Row>
          <Column><Text style={styles.totalLabel}>Skupaj</Text></Column>
          <Column style={styles.totalColumn}><Text style={styles.total}>{formatMoney(totalCents)}</Text></Column>
        </Row>
      </Section>

      {paymentUrl ? (
        <Button href={paymentUrl} style={styles.payButton}>Plačajte {formatMoney(totalCents)} s kartico</Button>
      ) : (
        <Button href={orderUrl} style={styles.button}>Oglejte si naročilo</Button>
      )}
      <Text style={styles.smallText}>Če imate vprašanje o naročilu, odgovorite na to sporočilo in navedite referenco {orderReference}.</Text>
    </EmailLayout>
  );
}

OrderStatusUpdateEmail.PreviewProps = {
  customerName: "Maja Novak",
  orderReference: "BIS-DEMO-1001",
  orderUrl: "https://bistrava.com/narocilo/BIS-DEMO-1001",
  totalCents: 78290,
  status: "shipped",
  shipment: { carrier: "Pošta Slovenije", trackingNumber: "PS123456789SI", trackingUrl: "https://sledenje.posta.si/" },
  items: [{ name: "Predstavitveni hišni filter H3", quantity: 1, lineTotalCents: 74900 }],
} satisfies OrderStatusEmailData;

const styles = {
  reference: { color: "#148F83", fontSize: "12px", lineHeight: "18px", fontWeight: 700, letterSpacing: "1px", margin: "0 0 16px", wordBreak: "break-word" as const },
  text: { color: "#263640", fontSize: "16px", lineHeight: "25px", margin: "0 0 14px" },
  textTight: { color: "#263640", fontSize: "15px", lineHeight: "23px", margin: 0 },
  highlightBox: { backgroundColor: "#EAF5F6", borderLeft: "4px solid #20B8A6", borderRadius: "8px", margin: "22px 0", padding: "14px" },
  cancelBox: { backgroundColor: "#FFF4EF", borderLeft: "4px solid #C2553B", borderRadius: "8px", margin: "22px 0", padding: "14px" },
  orderBox: { backgroundColor: "#F8FCFC", border: "1px solid #CFE2E5", borderRadius: "10px", margin: "22px 0", padding: "14px" },
  boxTitle: { color: "#10324A", fontSize: "17px", lineHeight: "24px", fontWeight: 700, margin: "0 0 10px" },
  detailLabel: { color: "#647780", fontSize: "12px", lineHeight: "16px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" as const, margin: "10px 0 2px" },
  detailValueStrong: { color: "#10324A", fontSize: "16px", lineHeight: "23px", fontWeight: 700, overflowWrap: "anywhere" as const, margin: 0 },
  trackingLinkRow: { margin: "14px 0 0" },
  trackingLink: { color: "#148F83", fontSize: "15px", fontWeight: 700 },
  item: { borderBottom: "1px solid #CFE2E5", padding: "8px 0" },
  itemName: { color: "#263640", fontSize: "15px", lineHeight: "22px", fontWeight: 600, overflowWrap: "anywhere" as const, margin: "0 0 2px" },
  itemMeta: { color: "#647780", fontSize: "14px", lineHeight: "21px", margin: 0 },
  itemPrice: { color: "#10324A", whiteSpace: "nowrap" as const },
  hr: { borderColor: "#CFE2E5", margin: "10px 0" },
  totalColumn: { textAlign: "right" as const, whiteSpace: "nowrap" as const },
  totalLabel: { color: "#10324A", fontSize: "16px", fontWeight: 700, margin: 0 },
  total: { color: "#10324A", fontSize: "20px", fontWeight: 800, margin: 0, textAlign: "right" as const },
  payButton: { backgroundColor: "#148F83", borderRadius: "8px", color: "#FFFFFF", display: "inline-block", fontSize: "16px", fontWeight: 700, padding: "15px 22px" },
  button: { backgroundColor: "#10324A", borderRadius: "8px", color: "#FFFFFF", display: "inline-block", fontSize: "15px", fontWeight: 700, padding: "13px 20px" },
  smallText: { color: "#647780", fontSize: "12px", lineHeight: "19px", marginTop: "20px" },
};
