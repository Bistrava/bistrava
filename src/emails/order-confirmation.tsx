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

// Each detail stacks its label above the value so long names and IBANs keep the full width on phones.
function BankDetail({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={strong ? styles.detailValueStrong : styles.detailValue}>{value}</Text>
    </>
  );
}

export default function OrderConfirmationEmail({
  customerName,
  orderReference,
  orderUrl,
  totalCents,
  items,
  bankTransfer,
  cardPaid,
}: OrderConfirmationEmailData) {
  return (
    <EmailLayout
      preview={`Potrditev naročila ${orderReference}`}
      title="Hvala za vaše naročilo."
    >
      <Text style={styles.reference}>NAROČILO {orderReference}</Text>
      <Text style={styles.text}>Pozdravljeni, {customerName}.</Text>
      <Text style={styles.text}>
        Naročilo <strong style={styles.nowrap}>{orderReference}</strong> smo prejeli.{" "}
        {bankTransfer ? 'Spodaj so bančni podatki in navodila za dokončno potrditev naročila.' : cardPaid ? 'Plačilo s kartico je uspešno potrjeno. Ko bo naročilo pripravljeno za odpremo, boste prejeli novo sporočilo.' : 'Ko bo plačilo varno potrjeno in naročilo pripravljeno, boste prejeli novo sporočilo.'}
      </Text>

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
          <Column>
            <Text style={styles.totalLabel}>Skupaj</Text>
          </Column>
          <Column style={styles.totalColumn}>
            <Text style={styles.total}>{formatMoney(totalCents)}</Text>
          </Column>
        </Row>
      </Section>

      {bankTransfer ? (
        <Section className="email-panel" style={styles.bankBox}>
          <Text style={styles.boxTitle}>Plačilo z bančnim nakazilom</Text>
          <Text style={styles.text}>Naročilo še ni plačano. V svoji banki nakažite <strong>{formatMoney(totalCents)}</strong> na naslednji račun:</Text>
          <BankDetail label="Prejemnik" value={bankTransfer.beneficiary} strong />
          <BankDetail label="IBAN" value={formatIban(bankTransfer.iban)} strong />
          <BankDetail label="Banka" value={bankTransfer.bankName} />
          {bankTransfer.bic ? <BankDetail label="BIC / SWIFT" value={bankTransfer.bic} /> : null}
          <BankDetail label="Valuta" value="EUR" />
          <BankDetail label="Namen / referenca" value={orderReference} strong />
          <Text style={styles.text}>V namen nakazila vpišite referenco naročila.</Text>
        </Section>
      ) : null}
      {bankTransfer ? (
        <Section className="email-panel" style={styles.proofBox}>
          <Text style={styles.boxTitle}>Naslednji korak: pošljite potrdilo o nakazilu</Text>
          <Text style={styles.text}>Po opravljenem nakazilu odgovorite na to e-sporočilo, priložite potrdilo o nakazilu in navedite referenco <strong style={styles.nowrap}>{orderReference}</strong>, da pospešimo obdelavo naročila.</Text>
          <Text style={styles.text}>Vaše naročilo bo <strong>dokončno potrjeno ob prejemu potrdila o nakazilu</strong>. Prejem sredstev preverimo ločeno. Če ste že plačali, ne nakazujte ponovno.</Text>
        </Section>
      ) : null}
      {cardPaid ? (
        <Section className="email-panel" style={styles.proofBox}>
          <Text style={styles.boxTitle}>Plačilo s kartico: plačano</Text>
          <Text style={styles.text}>Znesek <strong>{formatMoney(totalCents)}</strong> je bil plačan s kartico prek varnega plačilnega sistema Stripe. Podatkov kartice Bistrava ne prejme in ne hrani.</Text>
        </Section>
      ) : null}
      {!bankTransfer ? (
        <Button href={orderUrl} style={styles.button}>
          Oglejte si naročilo
        </Button>
      ) : null}
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
  reference: { color: "#148F83", fontSize: "12px", lineHeight: "18px", fontWeight: 700, letterSpacing: "1px", margin: "0 0 16px", wordBreak: "break-word" as const },
  text: { color: "#263640", fontSize: "16px", lineHeight: "25px", margin: "0 0 14px" },
  nowrap: { whiteSpace: "nowrap" as const },
  orderBox: {
    backgroundColor: "#EAF5F6",
    borderRadius: "10px",
    margin: "22px 0",
    padding: "14px",
  },
  boxTitle: { color: "#10324A", fontSize: "17px", lineHeight: "24px", fontWeight: 700, margin: "0 0 10px" },
  item: { borderBottom: "1px solid #CFE2E5", padding: "8px 0" },
  itemName: { color: "#263640", fontSize: "15px", lineHeight: "22px", fontWeight: 600, overflowWrap: "anywhere" as const, margin: "0 0 2px" },
  itemMeta: { color: "#647780", fontSize: "14px", lineHeight: "21px", margin: 0 },
  itemPrice: { color: "#10324A", whiteSpace: "nowrap" as const },
  hr: { borderColor: "#CFE2E5", margin: "10px 0" },
  totalColumn: { textAlign: "right" as const, whiteSpace: "nowrap" as const },
  totalLabel: { color: "#10324A", fontSize: "16px", fontWeight: 700, margin: 0 },
  total: {
    color: "#10324A",
    fontSize: "20px",
    fontWeight: 800,
    margin: 0,
    textAlign: "right" as const,
  },
  bankBox: { backgroundColor: "#F8FCFC", border: "1px solid #CFE2E5", borderRadius: "10px", margin: "22px 0", padding: "14px" },
  detailLabel: { color: "#647780", fontSize: "12px", lineHeight: "16px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" as const, margin: "10px 0 2px" },
  detailValue: { color: "#10324A", fontSize: "15px", lineHeight: "22px", overflowWrap: "anywhere" as const, margin: 0 },
  detailValueStrong: { color: "#10324A", fontSize: "16px", lineHeight: "23px", fontWeight: 700, overflowWrap: "anywhere" as const, margin: 0 },
  proofBox: { backgroundColor: "#EAF5F6", borderLeft: "4px solid #20B8A6", borderRadius: "8px", margin: "22px 0", padding: "14px" },
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
    marginTop: "20px",
  },
};
