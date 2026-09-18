"use client";

import { CheckCircle2, LockKeyhole, ShoppingBag, Truck } from "lucide-react";
import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createCheckoutOrder,
  initialCheckoutState,
} from "@/actions/checkout";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/commerce/money";
import type { ShippingRate } from "@/lib/commerce/shipping";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <span className="field-error">{errors[0]}</span> : null;
}

export function CheckoutForm({
  rates,
  orderingEnabled,
}: {
  rates: ShippingRate[];
  orderingEnabled: boolean;
}) {
  const { lines, subtotalCents, hydrated, clearCart } = useCart();
  const [state, formAction, pending] = useActionState(createCheckoutOrder, initialCheckoutState);
  const [shippingRateId, setShippingRateId] = useState(rates[0]?.id ?? "");
  const idempotencyRef = useRef<HTMLInputElement>(null);
  const guestTokenRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const shippingRate = useMemo(
    () => rates.find((rate) => rate.id === shippingRateId) ?? null,
    [rates, shippingRateId],
  );
  const totalCents = subtotalCents + (shippingRate?.priceCents ?? 0);
  const cartPayload = JSON.stringify(lines.map((line) => ({ sku: line.sku, quantity: line.quantity })));
  const canSubmit = hydrated && lines.length > 0 && orderingEnabled && rates.length > 0 && !pending;

  useEffect(() => {
    if (state.status !== "success" || !state.redirectUrl) return;
    clearCart();
    router.replace(state.redirectUrl as Route);
  }, [clearCart, router, state.redirectUrl, state.status]);

  const prepareSubmission = () => {
    if (idempotencyRef.current && !idempotencyRef.current.value) {
      idempotencyRef.current.value = crypto.randomUUID();
    }
    if (guestTokenRef.current && !guestTokenRef.current.value) {
      guestTokenRef.current.value = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    }
    const browser = window as typeof window & { dataLayer?: unknown[] };
    browser.dataLayer = browser.dataLayer || [];
    browser.dataLayer.push({
      event: "begin_checkout",
      ecommerce: {
        currency: "EUR",
        value: totalCents / 100,
        items: lines.map((line) => ({
          item_id: line.sku,
          item_name: line.nameSl,
          price: line.unitPriceCents / 100,
          quantity: line.quantity,
        })),
      },
    });
  };

  if (!hydrated) {
    return <div className="checkout-loading card" aria-live="polite">Blagajna se nalaga …</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="empty-state card">
        <ShoppingBag aria-hidden="true" size={38} />
        <h1>Za nadaljevanje potrebujete izdelek.</h1>
        <p>Košarica je prazna. Najprej izberite aktivni izdelek, ki je na voljo za spletni nakup.</p>
        <Link className="button button-primary" href="/mehcalci-vode">Nazaj na izdelke</Link>
      </div>
    );
  }

  return (
    <form className="checkout-layout" action={formAction} onSubmit={prepareSubmission}>
      <div className="checkout-fields">
        {!orderingEnabled ? (
          <div className="notice checkout-configuration-notice" role="status">
            <LockKeyhole aria-hidden="true" />
            <div>
              <strong>Sprejem naročil še ni aktiviran</strong>
              <p>Obrazec je pripravljen, vendar mora Bistrava pred vklopom potrditi način plačila in nastaviti dostavo.</p>
            </div>
          </div>
        ) : null}

        <section className="checkout-section card" aria-labelledby="contact-heading">
          <p className="section-kicker">1. Kontakt</p>
          <h2 id="contact-heading">Kontaktni podatki</h2>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="firstName">Ime</label>
              <input id="firstName" name="firstName" autoComplete="given-name" required />
              <FieldError errors={state.fieldErrors?.firstName} />
            </div>
            <div className="form-field">
              <label htmlFor="lastName">Priimek</label>
              <input id="lastName" name="lastName" autoComplete="family-name" required />
              <FieldError errors={state.fieldErrors?.lastName} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="email">E-pošta</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
              <FieldError errors={state.fieldErrors?.email} />
            </div>
            <div className="form-field">
              <label htmlFor="phone">Telefon</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" required />
              <FieldError errors={state.fieldErrors?.phone} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="company">Podjetje <span>(neobvezno)</span></label>
            <input id="company" name="company" autoComplete="organization" />
          </div>
        </section>

        <section className="checkout-section card" aria-labelledby="delivery-heading">
          <p className="section-kicker">2. Dostava</p>
          <h2 id="delivery-heading">Naslov in način dostave</h2>
          <div className="form-field">
            <label htmlFor="addressLine1">Naslov</label>
            <input id="addressLine1" name="addressLine1" autoComplete="address-line1" required />
            <FieldError errors={state.fieldErrors?.addressLine1} />
          </div>
          <div className="form-field">
            <label htmlFor="addressLine2">Dodatek k naslovu <span>(neobvezno)</span></label>
            <input id="addressLine2" name="addressLine2" autoComplete="address-line2" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="postalCode">Poštna številka</label>
              <input id="postalCode" name="postalCode" inputMode="numeric" autoComplete="postal-code" required />
              <FieldError errors={state.fieldErrors?.postalCode} />
            </div>
            <div className="form-field">
              <label htmlFor="city">Kraj</label>
              <input id="city" name="city" autoComplete="address-level2" required />
              <FieldError errors={state.fieldErrors?.city} />
            </div>
          </div>
          <input type="hidden" name="countryCode" value="SI" />
          <div className="form-field">
            <label htmlFor="shippingRateId">Način dostave</label>
            <select
              id="shippingRateId"
              name="shippingRateId"
              value={shippingRateId}
              onChange={(event) => setShippingRateId(event.target.value)}
              required
            >
              {rates.length === 0 ? <option value="">Dostava še ni nastavljena</option> : null}
              {rates.map((rate) => (
                <option value={rate.id} key={rate.id}>
                  {rate.name} – {formatMoney(rate.priceCents)}
                </option>
              ))}
            </select>
            <FieldError errors={state.fieldErrors?.shippingRateId} />
          </div>
          <div className="form-field">
            <label htmlFor="customerNote">Opomba <span>(neobvezno)</span></label>
            <textarea id="customerNote" name="customerNote" rows={4} maxLength={1000} />
          </div>
        </section>

        <section className="checkout-section card" aria-labelledby="confirmation-heading">
          <p className="section-kicker">3. Potrditev</p>
          <h2 id="confirmation-heading">Pregled in soglasje</h2>
          <label className="consent-field">
            <input type="checkbox" name="termsAccepted" required />
            <span>
              Potrjujem, da sem pregledal/-a podatke naročila ter se strinjam s trenutno
              različico <Link href="/pravna-obvestila">prodajnih pogojev</Link> in
              <Link href="/zasebnost"> politiko zasebnosti</Link>.
            </span>
          </label>
          <FieldError errors={state.fieldErrors?.termsAccepted} />
          <div className="honeypot-field" aria-hidden="true">
            <label htmlFor="checkout-website">Spletna stran</label>
            <input id="checkout-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <input type="hidden" name="cart" value={cartPayload} />
          <input ref={idempotencyRef} type="hidden" name="idempotencyKey" defaultValue="" />
          <input ref={guestTokenRef} type="hidden" name="guestToken" defaultValue="" />
          <p className={state.status === "error" ? "form-status form-status-error" : "form-status"} aria-live="polite">
            {state.message}
          </p>
          <button className="button button-primary checkout-submit" type="submit" disabled={!canSubmit}>
            <CheckCircle2 aria-hidden="true" size={20} />
            {pending ? "Oddajanje …" : "Oddajte naročilo v pregled"}
          </button>
          <small>Naročilo ni plačano, dokler plačilo ni potrjeno po varnem strežniškem postopku.</small>
        </section>
      </div>

      <aside className="checkout-summary card" aria-label="Povzetek naročila">
        <div className="checkout-summary-heading">
          <Truck aria-hidden="true" />
          <div><p className="section-kicker">Vaše naročilo</p><h2>Povzetek</h2></div>
        </div>
        <div className="checkout-summary-lines">
          {lines.map((line) => (
            <div className="checkout-summary-line" key={line.sku}>
              <div className="checkout-summary-image">
                {line.imageUrl ? <Image src={line.imageUrl} alt="" fill sizes="72px" /> : null}
                <b>{line.quantity}</b>
              </div>
              <div><strong>{line.nameSl}</strong><span>{line.sku}</span></div>
              <span>{formatMoney(line.unitPriceCents * line.quantity)}</span>
            </div>
          ))}
        </div>
        <dl>
          <div><dt>Vmesni seštevek</dt><dd>{formatMoney(subtotalCents)}</dd></div>
          <div><dt>Dostava</dt><dd>{shippingRate ? formatMoney(shippingRate.priceCents) : "Ni nastavljena"}</dd></div>
          <div className="checkout-total"><dt>Skupaj</dt><dd>{formatMoney(totalCents)}</dd></div>
        </dl>
        <p><LockKeyhole aria-hidden="true" size={16} /> Cene, zaloga in dostava se preverijo na strežniku.</p>
      </aside>
    </form>
  );
}
