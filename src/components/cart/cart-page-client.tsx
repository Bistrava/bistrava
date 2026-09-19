"use client";

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/commerce/money";

export function CartPageClient() {
  const { lines, itemCount, subtotalCents, hydrated, setQuantity, removeItem, clearCart } = useCart();
  const tracked = useRef(false);

  useEffect(() => {
    if (!hydrated || tracked.current) return;
    tracked.current = true;
    const browser = window as typeof window & { dataLayer?: unknown[] };
    browser.dataLayer = browser.dataLayer || [];
    browser.dataLayer.push({
      event: "view_cart",
      ecommerce: {
        currency: "EUR",
        value: subtotalCents / 100,
        items: lines.map((line) => ({
          item_id: line.sku,
          item_name: line.nameSl,
          price: line.unitPriceCents / 100,
          quantity: line.quantity,
        })),
      },
    });
  }, [hydrated, lines, subtotalCents]);

  if (!hydrated) {
    return <div className="cart-loading card" aria-live="polite">Košarica se nalaga …</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="empty-state card">
        <ShoppingBag aria-hidden="true" size={38} />
        <h1>Vaša košarica je prazna.</h1>
        <p>Dodajte izdelke iz trgovine in jih primerjajte pred zaključkom nakupa.</p>
        <Link className="button button-primary" href="/mehcalci-vode">
          Preglejte izdelke
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <section className="cart-lines" aria-labelledby="cart-heading">
        <div className="cart-heading-row">
          <div>
            <p className="section-kicker">Vaš izbor</p>
            <h1 id="cart-heading">Košarica</h1>
            <p>{itemCount} {itemCount === 1 ? "izdelek" : "izdelkov"}</p>
          </div>
          <button className="cart-clear" type="button" onClick={clearCart}>Izprazni košarico</button>
        </div>

        {lines.map((line) => (
          <article className="cart-line card" key={line.sku}>
            <Link className="cart-line-image" href={`/izdelki/${line.slug}`}>
              {line.imageUrl ? (
                <Image src={line.imageUrl} alt={line.imageAltSl} fill sizes="112px" />
              ) : (
                <ShoppingBag aria-hidden="true" />
              )}
            </Link>
            <div className="cart-line-copy">
              <span>{line.sku}</span>
              <h2><Link href={`/izdelki/${line.slug}`}>{line.nameSl}</Link></h2>
              <strong>{formatMoney(line.unitPriceCents)}</strong>
            </div>
            <div className="cart-quantity" aria-label={`Količina za ${line.nameSl}`}>
              <button
                type="button"
                aria-label="Zmanjšaj količino"
                onClick={() => setQuantity(line.sku, line.quantity - 1)}
              ><Minus aria-hidden="true" size={17} /></button>
              <span aria-live="polite">{line.quantity}</span>
              <button
                type="button"
                aria-label="Povečaj količino"
                disabled={line.quantity >= line.stockQuantity}
                onClick={() => setQuantity(line.sku, line.quantity + 1)}
              ><Plus aria-hidden="true" size={17} /></button>
            </div>
            <strong className="cart-line-total">{formatMoney(line.unitPriceCents * line.quantity)}</strong>
            <button
              className="cart-remove"
              type="button"
              aria-label={`Odstrani ${line.nameSl}`}
              onClick={() => removeItem(line.sku)}
            ><Trash2 aria-hidden="true" size={19} /></button>
          </article>
        ))}
      </section>

      <aside className="cart-summary card" aria-label="Povzetek košarice">
        <p className="section-kicker">Povzetek</p>
        <h2>Skupaj</h2>
        <dl>
          <div><dt>Vmesni seštevek</dt><dd>{formatMoney(subtotalCents)}</dd></div>
          <div><dt>Dostava</dt><dd>Izračun na blagajni</dd></div>
          <div className="cart-summary-total"><dt>Skupaj brez dostave</dt><dd>{formatMoney(subtotalCents)}</dd></div>
        </dl>
        <Link className="button button-primary" href="/blagajna">
          Nadaljujte na blagajno <ArrowRight aria-hidden="true" size={18} />
        </Link>
        <small>Informativne cene in razpoložljivost bodo potrjene pred sprejemom naročila.</small>
      </aside>
    </div>
  );
}
