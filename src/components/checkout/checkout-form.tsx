"use client";

import { CheckCircle2, LockKeyhole, ShoppingBag, Truck } from "lucide-react";
import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import { type FormEvent, useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createCheckoutOrder,
  quoteCheckout,
} from "@/actions/checkout";
import { initialCheckoutState } from "@/lib/forms/action-state";
import { useCart, useCartCatalog } from "@/components/cart/cart-provider";
import { CartReviewNotice } from "@/components/cart/cart-page-client";
import type { CartCatalogSnapshot } from "@/lib/cart/cart";
import { formatMoney } from "@/lib/commerce/money";
import type { ShippingRate } from "@/lib/commerce/shipping";
import type { CheckoutQuoteState } from "@/lib/validation/checkout";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <span className="field-error">{errors[0]}</span> : null;
}

export function CheckoutForm({
  rates,
  orderingEnabled,
  catalog,
}: {
  rates: ShippingRate[];
  orderingEnabled: boolean;
  catalog: CartCatalogSnapshot;
}) {
  const { lines, changes, subtotalCents, hydrated, clearCart, acknowledgeChanges } = useCart();
  const catalogCurrent = useCartCatalog(catalog);
  const [state, formAction, pending] = useActionState(createCheckoutOrder, initialCheckoutState);
  const [shippingRateId, setShippingRateId] = useState(rates[0]?.id ?? "");
  const idempotencyRef = useRef<HTMLInputElement>(null);
  const guestTokenRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [discountCode, setDiscountCode] = useState("");
  const [quoteState, setQuoteState] = useState<{ key: string; result: CheckoutQuoteState } | null>(null);
  const [quoting, startQuote] = useTransition();
  const [acknowledgedQuote, setAcknowledgedQuote] = useState("");

  const shippingRate = useMemo(
    () => rates.find((rate) => rate.id === shippingRateId) ?? null,
    [rates, shippingRateId],
  );
  const cartPayload = JSON.stringify(lines.map((line) => ({ sku: line.sku, quantity: line.quantity })));
  const normalizedCode = discountCode.trim().toUpperCase();
  const quoteKey = `${cartPayload}:${subtotalCents}:${shippingRateId}:${shippingRate?.priceCents ?? 0}:${normalizedCode}`;
  const currentQuote = quoteState?.key === quoteKey ? quoteState.result : null;
  const appliedQuote = currentQuote?.status === "success" && currentQuote.quote?.subtotalCents === subtotalCents && currentQuote.quote?.shippingCents === shippingRate?.priceCents ? currentQuote.quote : null;
  const totalCents = appliedQuote?.totalCents ?? subtotalCents + (shippingRate?.priceCents ?? 0);
  const promotionReady = !normalizedCode || (appliedQuote?.code === normalizedCode && acknowledgedQuote === quoteKey);
  const canSubmit = catalogCurrent && changes.length === 0 && lines.length > 0 &&
    orderingEnabled && rates.length > 0 && !pending && !quoting && promotionReady;

  useEffect(() => {
    if (state.status !== "success" || !state.redirectUrl) return;
    clearCart();
    router.replace(state.redirectUrl as Route);
  }, [clearCart, router, state.redirectUrl, state.status]);

  const prepareSubmission = (event: FormEvent<HTMLFormElement>) => {
    if (!canSubmit) {
      event.preventDefault();
      return;
    }
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

  if (!hydrated || (catalog.verified && !catalogCurrent)) {
    return <div className="checkout-loading card" aria-live="polite">Blagajna se nalaga …</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="empty-state card">
        <ShoppingBag aria-hidden="true" size={38} />
        <h1>Za nadaljevanje potrebujete izdelek.</h1>
        <p>Košarica je prazna. Najprej izberite aktivni izdelek, ki je na voljo za spletni nakup.</p>
        <CartReviewNotice changes={changes} />
        <Link className="button button-primary" href="/mehcalci-vode">Nazaj na izdelke</Link>
      </div>
    );
  }

  return (
    <form className="checkout-layout" action={formAction} onSubmit={prepareSubmission}>
      <div className="checkout-fields">
        {!catalog.verified ? (
          <div className="notice checkout-configuration-notice" role="alert">
            <LockKeyhole aria-hidden="true" />
            <div>
              <strong>Cen in zaloge trenutno ni mogoče preveriti.</strong>
              <p>Vaša košarica je shranjena. Za varno oddajo naročila ponovno preverite podatke.</p>
              <button className="button button-secondary" type="button" disabled={refreshing}
                onClick={() => startRefresh(() => router.refresh())}>
                {refreshing ? "Preverjanje …" : "Ponovno preveri"}
              </button>
            </div>
          </div>
        ) : null}
        <CartReviewNotice changes={changes} onAcknowledge={catalogCurrent ? acknowledgeChanges : undefined} />
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
              različico <Link href="/splosni-pogoji-poslovanja">splošnih pogojev poslovanja</Link> in
              <Link href="/zasebnost"> politiko zasebnosti</Link>.
            </span>
          </label>
          <FieldError errors={state.fieldErrors?.termsAccepted} />
          <div className="honeypot-field" aria-hidden="true">
            <label htmlFor="checkout-website">Spletna stran</label>
            <input id="checkout-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <input type="hidden" name="cart" value={cartPayload} />
          <input type="hidden" name="discountCode" value={appliedQuote?.code ?? ""} />
          <input type="hidden" name="expectedTotalCents" value={totalCents} />
          <input type="hidden" name="discountAcknowledged" value={appliedQuote && acknowledgedQuote === quoteKey ? "on" : ""} />
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
        <div className="form-field">
          <label htmlFor="promotion-code">Promocijska koda <span>(neobvezno)</span></label>
          <input id="promotion-code" maxLength={40} value={discountCode} onChange={(event) => { setDiscountCode(event.target.value.toUpperCase()); setAcknowledgedQuote(""); }} autoCapitalize="characters" autoComplete="off" />
          <button className="button button-secondary" type="button" disabled={!normalizedCode || !shippingRate || !catalogCurrent || quoting || pending} onClick={() => startQuote(async () => {
            const key = quoteKey;
            try { setQuoteState({ key, result: await quoteCheckout({ cart: cartPayload, shippingRateId, discountCode: normalizedCode }) }); }
            catch { setQuoteState({ key, result: { status: "error", message: "Preverjanje ni uspelo. Poskusite ponovno." } }); }
            setAcknowledgedQuote("");
          })}>{quoting ? "Preverjanje …" : "Uporabi kodo"}</button>
          {normalizedCode ? <button className="button button-secondary" type="button" onClick={() => { setDiscountCode(""); setQuoteState(null); setAcknowledgedQuote(""); }}>Odstrani kodo</button> : null}
          <p role="status" className={currentQuote?.status === "error" ? "form-status form-status-error" : "form-status"}>{currentQuote?.message ?? (normalizedCode ? "Za prikaz popusta preverite kodo." : "")}</p>
        </div>
        <dl>
          <div><dt>Vmesni seštevek</dt><dd>{formatMoney(subtotalCents)}</dd></div>
          <div><dt>Dostava</dt><dd>{shippingRate ? formatMoney(shippingRate.priceCents) : "Ni nastavljena"}</dd></div>
          {appliedQuote ? <div><dt>Popust ({appliedQuote.code})</dt><dd>−{formatMoney(appliedQuote.discountCents)}</dd></div> : null}
          <div className="checkout-total"><dt>Skupaj</dt><dd>{formatMoney(totalCents)}</dd></div>
        </dl>
        {appliedQuote ? <label className="consent-field"><input type="checkbox" checked={acknowledgedQuote === quoteKey} onChange={(event) => setAcknowledgedQuote(event.target.checked ? quoteKey : "")} /><span>Potrjujem končni znesek {formatMoney(totalCents)} z upoštevanim popustom.</span></label> : null}
        <p><LockKeyhole aria-hidden="true" size={16} /> Cene, zaloga in dostava se preverijo na strežniku.</p>
      </aside>
    </form>
  );
}
