"use client";

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useCart, useCartCatalog } from "@/components/cart/cart-provider";
import type { CartCatalogSnapshot, CartChange } from "@/lib/cart/cart";
import { formatMoney } from "@/lib/commerce/money";

export function CartReviewNotice({
  changes,
  onAcknowledge,
}: {
  changes: CartChange[];
  onAcknowledge?: () => void;
}) {
  if (changes.length === 0) return null;
  return (
    <div className="notice" role="status">
      <div>
        <strong>Košarico smo posodobili.</strong>
        <p>Preverite trenutne cene, količine in razpoložljivost pred oddajo naročila.</p>
        <ul>
          {changes.map((change) => (
            <li key={`${change.sku}:${change.kind}`}>
              {change.nameSl}: {change.kind === "price"
                ? `cena ${formatMoney(change.previousValue)} → ${formatMoney(change.nextValue)}.`
                : change.kind === "quantity"
                  ? `količina ${change.previousValue} → ${change.nextValue} zaradi trenutne zaloge.`
                  : "izdelek ni več na voljo za spletni nakup in je bil odstranjen."}
            </li>
          ))}
        </ul>
        {onAcknowledge ? (
          <button className="button button-secondary" type="button" onClick={onAcknowledge}>
            Potrjujem posodobljene cene in količine
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CartPageClient({ catalog }: { catalog: CartCatalogSnapshot }) {
  const { lines, changes, itemCount, subtotalCents, hydrated, setQuantity, removeItem, clearCart } = useCart();
  const catalogCurrent = useCartCatalog(catalog);
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const tracked = useRef(false);

  useEffect(() => {
    if (!catalogCurrent || tracked.current) return;
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
  }, [catalogCurrent, lines, subtotalCents]);

  if (!hydrated || (catalog.verified && !catalogCurrent)) {
    return <div className="cart-loading card" aria-live="polite">Košarica se nalaga …</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="empty-state card">
        <ShoppingBag aria-hidden="true" size={38} />
        <h1>Vaša košarica je prazna.</h1>
        <p>Dodajte izdelke iz trgovine in jih primerjajte pred zaključkom nakupa.</p>
        <CartReviewNotice changes={changes} />
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

        {!catalog.verified ? (
          <div className="notice" role="alert">
            <div>
              <strong>Cen in zaloge trenutno ni mogoče preveriti.</strong>
              <p>Vaša košarica je shranjena. Pred nadaljevanjem ponovno preverite podatke.</p>
              <button className="button button-secondary" type="button" disabled={refreshing}
                onClick={() => startRefresh(() => router.refresh())}>
                {refreshing ? "Preverjanje …" : "Ponovno preveri"}
              </button>
            </div>
          </div>
        ) : null}
        <CartReviewNotice changes={changes} />

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
              {catalogCurrent ? <small>Na zalogi · {line.stockQuantity} kosov</small> : null}
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
        {catalogCurrent ? (
          <Link className="button button-primary" href="/blagajna" prefetch={false}>
            Nadaljujte na blagajno <ArrowRight aria-hidden="true" size={18} />
          </Link>
        ) : (
          <button className="button button-primary" type="button" disabled>
            Pred nadaljevanjem preverite cene in zalogo
          </button>
        )}
        <small>Cene in zaloga se ob oddaji naročila ponovno preverijo.</small>
      </aside>
    </div>
  );
}
