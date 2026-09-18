import type { Metadata } from "next";
import { CheckCircle2, LockKeyhole, Mail, PackageCheck } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { formatMoney } from "@/lib/commerce/money";
import { getGuestOrder } from "@/lib/orders/guest-orders";

export const metadata: Metadata = {
  title: "Naročilo",
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = await getGuestOrder(reference);

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
      <div className="container"><Breadcrumbs items={[{ label: "Naročilo", href: `/narocilo/${reference}` }]} /></div>
      <section className="order-success-hero">
        <div className="narrow-container">
          <CheckCircle2 aria-hidden="true" size={48} />
          <p className="section-kicker">Naročilo je sprejeto v pregled</p>
          <h1>Hvala za vaše naročilo.</h1>
          <p>Referenca: <strong>{order.reference}</strong></p>
        </div>
      </section>
      <section className="section order-detail-section">
        <div className="container order-detail-grid">
          <div className="order-detail-main card">
            <div className="order-detail-heading"><PackageCheck aria-hidden="true" /><div><p className="section-kicker">Stanje</p><h2>V pregledu</h2></div></div>
            <p>Naročilo smo shranili. Plačilo še ni potrjeno; Bistrava bo po preverbi dobavljivosti in načina plačila poslala nadaljnja navodila.</p>
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
              <div><dt>Skupaj</dt><dd>{formatMoney(order.totalCents)}</dd></div>
            </dl>
          </div>
          <aside className="order-contact-card card">
            <Mail aria-hidden="true" />
            <h2>Potrditev in dostava</h2>
            <p>Obvestilo je namenjeno naslovu <strong>{order.email}</strong>, če je e-poštna storitev konfigurirana.</p>
            <address>{addressLines.map((line) => <span key={line}>{line}</span>)}</address>
            <p className="order-security-note"><LockKeyhole aria-hidden="true" size={16} /> Dostop je zaščiten z zasebnim žetonom v brskalniku.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
