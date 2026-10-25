import type { Metadata } from "next";
import { CheckCircle2, LockKeyhole, Mail, PackageCheck } from "lucide-react";
import Link from "next/link";

import { PurchaseConversion } from "@/components/analytics/purchase-conversion";
import { ClearCartOnArrival } from "@/components/checkout/clear-cart-on-arrival";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { formatMoney } from "@/lib/commerce/money";
import { getGuestOrder } from "@/lib/orders/guest-orders";
import { paymentStatusCopy } from '@/lib/payments/bank-transfer';
import { syncCardPayment } from "@/lib/payments/stripe";

export const metadata: Metadata = {
  title: "Naročilo",
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { reference } = await params;
  const cameFromCardPayment = (await searchParams).placilo === "kartica";
  let order = await getGuestOrder(reference);
  if (order?.cardPayment?.intentId && order.status === "awaiting_payment") {
    // The Stripe webhook can arrive after the customer; ask Stripe directly so the page is accurate.
    const synced = await syncCardPayment(order.cardPayment.intentId).catch(() => null);
    if (synced) order = await getGuestOrder(reference);
  }

  if (!order) {
    return (
      <>
        <div className="container"><Breadcrumbs items={[{ label: "Naročilo", href: `/narocilo/${reference}` }]} /></div>
        <section className="section utility-page">
          <div className="narrow-container empty-state card">
            <LockKeyhole aria-hidden="true" size={38} />
            <h1>Podatki o naročilu niso dostopni.</h1>
            <p>Zaščitena povezava ni prisotna ali pa naročilo ne obstaja. Referenca v naslovu sama ne omogoča dostopa.</p>
            <Link className="button button-primary" href="/kontakt">Kontaktirajte Bistrava</Link>
          </div>
        </section>
      </>
    );
  }

  const address = order.shippingAddress;
  const statusCopy = paymentStatusCopy(order.status, Boolean(order.transferProofReceivedAt), Boolean(order.cardPayment));
  const customerName = [address.firstName, address.lastName].filter(Boolean).join(" ");
  const addressLines = [
    customerName,
    address.company,
    address.addressLine1,
    address.addressLine2,
    [address.postalCode, address.city].filter(Boolean).join(" "),
    "Slovenija",
  ].filter(Boolean).map(String);

  return (
    <>
      {cameFromCardPayment ? <ClearCartOnArrival /> : null}
      <PurchaseConversion
        order={{
          reference: order.reference,
          status: order.status,
          subtotalCents: order.subtotalCents,
          discountCents: order.discountCents,
          items: order.items.map((item) => ({
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          })),
        }}
      />
      <div className="container"><Breadcrumbs items={[{ label: "Naročilo", href: `/narocilo/${reference}` }]} /></div>
      <section className="order-success-hero">
        <div className="narrow-container">
          <CheckCircle2 aria-hidden="true" size={48} />
          <p className="section-kicker">{statusCopy}</p>
          <h1>Hvala za vaše naročilo.</h1>
          <p>Referenca: <strong>{order.reference}</strong></p>
          <div className="order-success-actions">
            <Link className="button button-primary" href="/mehcalci-vode#katalog">Nadaljuj z nakupovanjem</Link>
            <Link className="button button-secondary" href="/">Na domačo stran</Link>
          </div>
        </div>
      </section>
      <section className="section order-detail-section">
        <div className="container order-detail-grid">
          <div className="order-detail-main card">
            <div className="order-detail-heading"><PackageCheck aria-hidden="true" /><div><p className="section-kicker">Stanje</p><h2>{statusCopy}</h2></div></div>
            {order.cardPayment && ['pending', 'awaiting_payment'].includes(order.status) ? (
              order.cardPayment.status === 'failed' || order.cardPayment.status === 'cancelled'
                ? <p>Plačilo s kartico ni uspelo, zato kartica ni bila bremenjena. Naročilo je shranjeno; za dokončanje plačila pišite na <a href="mailto:kontakt@bistrava.com">kontakt@bistrava.com</a> in navedite referenco {order.reference}.</p>
                : <p>Plačilo s kartico se še preverja. Ko ga plačilni sistem potrdi, boste prejeli e-sporočilo na <strong>{order.email}</strong>. Stran lahko osvežite čez nekaj trenutkov. Plačila ne ponavljajte.</p>
            ) : order.bankTransfer && ['pending', 'awaiting_payment'].includes(order.status)?<>
              {order.transferProofReceivedAt ? <p>Prejeli smo vaše potrdilo o nakazilu. Naročilo je dokončno potrjeno. Prejem sredstev preverimo ločeno. Nakazila ne ponavljajte.</p> : <>
                <p>Naročilo smo shranili. Bančne podatke, točen znesek in referenco za nakazilo prejmete v samodejnem e-sporočilu na <strong>{order.email}</strong>.</p>
                <p>Po opravljenem nakazilu odgovorite na to e-sporočilo in priložite potrdilo o nakazilu, da pospešimo obdelavo. Naročilo bo dokončno potrjeno ob prejemu vašega potrdila. Če ste nakazilo že izvedli, ga ne ponavljajte.</p>
              </>}
            </>:<p>{['paid','processing','shipped','completed'].includes(order.status)?(order.cardPayment?'Plačilo s kartico je potrjeno. Potrditev smo poslali na vaš e-poštni naslov.':'Plačilo je potrjeno. Hvala za vaše naročilo.'):order.status==='cancelled'?'Naročilo je preklicano. Zanj ne izvajajte nakazila. Za pomoč se obrnite na kontakt@bistrava.com.':order.status==='refunded'||order.status==='partially_refunded'?'Povračilo je zabeleženo. Za podrobnosti se obrnite na kontakt@bistrava.com.':'Naročilo smo shranili. Za naslednje korake se obrnite na kontakt@bistrava.com.'}</p>}
            <div className="order-items">
              {order.items.map((item) => (
                <div key={item.sku}>
                  <div><strong>{item.quantity} × {item.name}</strong><span>{item.sku}</span></div>
                  <strong>{formatMoney(item.lineTotalCents)}</strong>
                </div>
              ))}
            </div>
            <dl className="order-totals">
              <div><dt>Izdelki</dt><dd>{formatMoney(order.subtotalCents)}</dd></div>
              <div><dt>Dostava</dt><dd>{formatMoney(order.shippingCents)}</dd></div>
              {order.discountCents>0?<div><dt>Popust</dt><dd>−{formatMoney(order.discountCents)}</dd></div>:null}
              <div><dt>Skupaj</dt><dd>{formatMoney(order.totalCents)}</dd></div>
            </dl>
          </div>
          <aside className="order-contact-card card">
            <Mail aria-hidden="true" />
            <h2>Potrditev in dostava</h2>
            <p>E-poštni naslov za obvestila: <strong>{order.email}</strong>. Če potrditve ne prejmete, preverite neželeno pošto ali pišite na <a href="mailto:kontakt@bistrava.com">kontakt@bistrava.com</a>.</p>
            <address>{addressLines.map((line) => <span key={line}>{line}</span>)}</address>
            <p className="order-security-note"><LockKeyhole aria-hidden="true" size={16} /> Dostop je zaščiten z zasebnim žetonom v brskalniku.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
