import type { Metadata } from "next";
import { CheckCircle2, CreditCard, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { PayOrderForm } from "@/components/checkout/pay-order-form";
import { formatMoney } from "@/lib/commerce/money";
import { getCardPaymentConfig } from "@/lib/commerce/config";
import { verifyPaymentLinkToken } from "@/lib/payments/payment-link";
import { getCardPaymentSession } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Plačilo naročila",
  robots: { index: false, follow: false },
};

function Notice({ title, text, success = false }: { title: string; text: string; success?: boolean }) {
  return (
    <section className="section utility-page">
      <div className="narrow-container empty-state card">
        {success ? <CheckCircle2 aria-hidden="true" size={38} /> : <LockKeyhole aria-hidden="true" size={38} />}
        <h1>{title}</h1>
        <p>{text}</p>
        <Link className="button button-primary" href={success ? "/mehcalci-vode#katalog" : "/kontakt"}>{success ? "Nadaljuj z nakupovanjem" : "Kontaktirajte Bistravo"}</Link>
      </div>
    </section>
  );
}

// Card payment page reached from the "awaiting payment" e-mail; access requires the signed link.
export default async function PayOrderPage({ params, searchParams }: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { reference } = await params;
  const query = await searchParams;
  const token = typeof query.k === "string" ? query.k : undefined;
  const invalid = <Notice title="Povezava za plačilo ni veljavna." text="Preverite, da ste odprli celotno povezavo iz e-sporočila, ali nam pišite na kontakt@bistrava.com." />;
  if (!/^BIS-[A-Z0-9-]{8,32}$/.test(reference) || !token) return invalid;

  const db = createAdminClient();
  const card = getCardPaymentConfig();
  if (!db || !card) return <Notice title="Plačilo s kartico trenutno ni na voljo." text="Poskusite pozneje ali nam pišite na kontakt@bistrava.com." />;
  const { data: order } = await db
    .from("orders")
    .select("id,reference,status,checkout_mode,total_cents,order_items(product_name,quantity,line_total_cents)")
    .eq("reference", reference)
    .maybeSingle();
  if (!order || !verifyPaymentLinkToken(String(order.id), token)) return invalid;

  if (["paid", "processing", "shipped", "completed"].includes(String(order.status))) {
    return <Notice success title="Naročilo je plačano." text={`Plačilo za naročilo ${order.reference} je potrjeno. Hvala za nakup.`} />;
  }
  if (order.status !== "awaiting_payment" || order.checkout_mode !== "card") {
    return <Notice title="Naročila ni mogoče plačati s to povezavo." text={`Za naročilo ${order.reference} nam pišite na kontakt@bistrava.com.`} />;
  }

  const session = await getCardPaymentSession(String(order.id)).catch(() => ({ state: "unavailable" as const }));
  if (session.state === "paid") return <Notice success title="Plačilo je uspelo." text={`Naročilo ${order.reference} je plačano. Potrditev smo poslali na vaš e-poštni naslov.`} />;
  if (session.state === "processing") return <Notice title="Plačilo se obdeluje." text="Banka še potrjuje plačilo. Stran osvežite čez nekaj minut; plačila ne ponavljajte." />;
  if (session.state !== "payable") return <Notice title="Plačila trenutno ni mogoče izvesti." text={`Za naročilo ${order.reference} nam pišite na kontakt@bistrava.com.`} />;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bistrava.com";
  const returnUrl = new URL(`/placilo/${order.reference}?k=${encodeURIComponent(token)}`, siteUrl).toString();
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  return (
    <>
      <section className="checkout-hero">
        <div className="container">
          <p className="section-kicker">Varno plačilo</p>
          <h1>Plačilo naročila {order.reference}</h1>
          <p>Za plačilo vnesite podatke kartice. Podatke kartice varno obdela plačilni sistem Stripe; Bistrava jih ne prejme in ne hrani.</p>
        </div>
      </section>
      <section className="section checkout-page">
        <div className="container checkout-layout">
          <div className="checkout-fields">
            <section className="checkout-section card" aria-labelledby="pay-heading">
              <p className="section-kicker">Plačilo s kartico</p>
              <h2 id="pay-heading"><CreditCard aria-hidden="true" size={22} /> Podatki kartice</h2>
              <PayOrderForm publishableKey={card.publishableKey} clientSecret={session.clientSecret} amountCents={Number(order.total_cents)} returnUrl={returnUrl} />
            </section>
          </div>
          <aside className="checkout-summary card" aria-label="Povzetek naročila">
            <div className="checkout-summary-heading"><div><p className="section-kicker">Vaše naročilo</p><h2>{order.reference}</h2></div></div>
            <div className="checkout-summary-lines">
              {items.map((item, index) => (
                <div className="checkout-summary-line" key={`${item.product_name}-${index}`}>
                  <div><strong>{item.quantity} × {String(item.product_name)}</strong></div>
                  <span>{formatMoney(Number(item.line_total_cents))}</span>
                </div>
              ))}
            </div>
            <dl><div className="checkout-total"><dt>Za plačilo</dt><dd>{formatMoney(Number(order.total_cents))}</dd></div></dl>
            <p><LockKeyhole aria-hidden="true" size={16} /> Znesek je določen ob naročilu in se ne spremeni.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
