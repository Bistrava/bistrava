import {
  Button,
  Column,
  Hr,
  Row,
  Section,
  Text,
} from "react-email";

import { EmailLayout } from "@/emails/_components/email-layout";
import { formatMoney } from "@/lib/commerce/money";
import type { OrderConfirmationEmailData } from "@/lib/validation/email";
import { formatIban } from "@/lib/payments/bank-transfer";

export default function OrderConfirmationEmail({
  customerName,
  orderReference,
  orderUrl,
  totalCents,
  items,
  bankTransfer,
}: OrderConfirmationEmailData) {
  return (
    <EmailLayout
      preview={`Potrditev naročila ${orderReference}`}
      title="Hvala za vaše naročilo."
    >
      <Text style={styles.reference}>NAROČILO {orderReference}</Text>
      <Text style={styles.text}>Pozdravljeni, {customerName}.</Text>
      <Text style={styles.text}>
        Naročilo <strong>{orderReference}</strong> smo prejeli.{" "}
        {bankTransfer ? 'Spodaj so bančni podatki in navodila za dokončno potrditev naročila.' : 'Ko bo plačilo varno potrjeno in naročilo pripravljeno, boste prejeli novo sporočilo.'}
      </Text>

      <Section className="email-panel" style={styles.orderBox}>
        <Text style={styles.boxTitle}>Povzetek naročila</Text>
        {items.map((item, index) => (
          <Row key={`${item.name}-${index}`} style={styles.itemRow}>
            <Column style={styles.itemColumn}>
            <Text style={styles.itemName}>
              {item.quantity} × {item.name}
            </Text>
            </Column>
            <Column style={styles.priceColumn}>
            <Text style={styles.itemPrice}>{formatMoney(item.lineTotalCents)}</Text>
            </Column>
          </Row>
        ))}
        <Hr style={styles.hr} />
        <Row>
          <Column>
          <Text style={styles.totalLabel}>Skupaj</Text>
          </Column>
          <Column style={styles.priceColumn}>
          <Text style={styles.total}>{formatMoney(totalCents)}</Text>
          </Column>
        </Row>
      </Section>

      {bankTransfer?<Section className="email-panel" style={styles.bankBox}><Text style={styles.boxTitle}>Plačilo z bančnim nakazilom</Text>
        <Text style={styles.text}>Naročilo še ni plačano. V svoji banki nakažite {formatMoney(totalCents)} na naslednji račun:</Text>
        <Text style={styles.bankDetails}>Prejemnik: <strong>{bankTransfer.beneficiary}</strong><br/>IBAN: <strong>{formatIban(bankTransfer.iban)}</strong><br/>Banka: {bankTransfer.bankName}<br/>{bankTransfer.bic?<>BIC / SWIFT: {bankTransfer.bic}<br/></>:null}Valuta: EUR<br/>Namen / referenca: <strong>{orderReference}</strong></Text>
        <Text style={styles.text}>V namen nakazila vpišite referenco naročila.</Text>
      </Section>:null}
      {bankTransfer?<Section className="email-panel" style={styles.proofBox}>
        <Text style={styles.boxTitle}>Naslednji korak: pošljite potrdilo o nakazilu</Text>
        <Text style={styles.text}>Po opravljenem nakazilu odgovorite na to e-sporočilo, priložite potrdilo o nakazilu in navedite referenco <strong>{orderReference}</strong>, da pospešimo obdelavo naročila.</Text>
        <Text style={styles.text}>Vaše naročilo bo <strong>dokončno potrjeno ob prejemu potrdila o nakazilu</strong>. Prejem sredstev preverimo ločeno. Če ste že plačali, ne nakazujte ponovno.</Text>
      </Section>:null}
      {!bankTransfer?<Button href={orderUrl} style={styles.button}>
        Oglejte si naročilo
      </Button>:null}
      <Text style={styles.smallText}>
        Če naročila niste oddali vi, odgovorite na to sporočilo.
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
  reference: { color: "#148F83", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", margin: "0 0 20px", wordBreak: "break-word" as const },
  text: { color: "#263640", fontSize: "16px", lineHeight: "26px" },
  orderBox: {
    backgroundColor: "#EAF5F6",
    borderRadius: "12px",
    margin: "26px 0",
    padding: "18px 20px",
  },
  boxTitle: { color: "#10324A", fontSize: "17px", lineHeight: "24px", fontWeight: 700, margin: "0 0 12px" },
  bankBox: { backgroundColor: "#F8FCFC", border: "1px solid #CFE2E5", borderRadius: "12px", margin: "24px 0", padding: "20px" },
  bankDetails: { color: "#10324A", fontSize: "14px", lineHeight: "27px", overflowWrap: "anywhere" as const, wordBreak: "break-word" as const },
  proofBox: { backgroundColor: "#EAF5F6", borderLeft: "4px solid #20B8A6", borderRadius: "8px", margin: "24px 0", padding: "20px" },
  itemColumn: { verticalAlign: "top" },
  priceColumn: { textAlign: "right" as const, verticalAlign: "top", width: "100px" },
  itemRow: { borderBottom: "1px solid #CFE2E5", tableLayout: "fixed" as const },
  itemName: { color: "#263640", fontSize: "14px", lineHeight: "22px", wordBreak: "break-word" as const, margin: "10px 0" },
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
