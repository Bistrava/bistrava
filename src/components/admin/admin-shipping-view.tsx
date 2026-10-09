"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, MapPin, Plus, Save, Truck } from "lucide-react";
import { saveAdminShippingRate, saveAdminShippingZone } from "@/actions/admin-orders";
import { useAdminLanguage } from "@/components/admin/admin-i18n";
import { initialOrderActionState, type AdminShippingData, type AdminShippingRate, type AdminShippingZone } from "@/lib/admin/order-management";
import type { AdminOrder } from "@/lib/admin/orders";
import "@/components/admin/order-admin.css";

export function AdminShippingView({ data, orders, canManage }: { data: AdminShippingData; orders: AdminOrder[]; canManage: boolean }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [rateId, setRateId] = useState(data.rates[0]?.id ?? "");
  const [zoneId, setZoneId] = useState(data.zones[0]?.id ?? "");
  const rate = data.rates.find((value) => value.id === rateId);
  const zone = data.zones.find((value) => value.id === zoneId);
  const shipments = orders.filter((order) => order.shipment || ["paid", "processing", "shipped"].includes(order.status));
  const formatMoney = (cents: number) => new Intl.NumberFormat(fr ? "fr-FR" : "sl-SI", { style: "currency", currency: "EUR" }).format(cents / 100);
  const shipmentLabels: Record<string, string> = fr ? { pending: "En attente", ready: "Prêt", shipped: "Expédié", in_transit: "En transit", delivered: "Livré", cancelled: "Annulé", returned: "Retourné" } : { pending: "Čaka", ready: "Pripravljeno", shipped: "Poslano", in_transit: "Na poti", delivered: "Dostavljeno", cancelled: "Preklicano", returned: "Vrnjeno" };

  return <div>
    <header className="admin-page-heading"><div><p className="section-kicker">{fr ? "Expédition et transport" : "Odprema in prevoz"}</p><h1>{fr ? "Livraisons" : "Dostava"}</h1><p>{fr ? "Suivez les colis et configurez les tarifs proposés lors de la commande." : "Spremljajte pošiljke in nastavite tarife, prikazane ob naročilu."}</p></div><span className="admin-section-hero-icon"><Truck size={28} /></span></header>
    {data.source === "unavailable" ? <p className="admin-operation-message is-error" role="alert">{fr ? "Les paramètres de livraison ne sont pas disponibles. Vérifiez la connexion Supabase." : "Nastavitve dostave niso na voljo. Preverite povezavo Supabase."}</p> : null}
    <section className="admin-shipping-section">
      <header><h2>{fr ? "Colis à suivre" : "Sledenje pošiljkam"}</h2><Link className="text-link" href="/admin/narocila">{fr ? "Toutes les commandes" : "Vsa naročila"}<ArrowRight size={16} /></Link></header>
      <div className="admin-shipment-list">{shipments.length ? shipments.map((order) => <Link href={`/admin/narocila?order=${order.id}`} key={order.id}><span><strong>{order.reference}</strong><small>{order.shippingAddress.firstName} {order.shippingAddress.lastName} · {order.shippingAddress.city}</small></span><span><strong>{order.shipment?.carrier || (fr ? "Transporteur à renseigner" : "Prevoznik ni vpisan")}</strong><small>{order.shipment?.trackingNumber || "—"}</small></span><span>{shipmentLabels[order.shipment?.status ?? "pending"]}</span><ArrowRight size={18} aria-hidden="true" /></Link>) : <p className="admin-operational-empty card">{fr ? "Aucune expédition pour le moment. Les commandes payées et les colis apparaîtront ici." : "Trenutno ni pošiljk. Tukaj bodo prikazana plačana naročila in pošiljke."}</p>}</div>
    </section>
    <section className="admin-shipping-section">
      <header><h2>{fr ? "Tarifs de livraison" : "Tarife dostave"}</h2>{canManage && data.zones.length > 0 ? <button className="button button-secondary" onClick={() => setRateId("")} type="button"><Plus size={17} />{fr ? "Nouveau tarif" : "Nova tarifa"}</button> : null}</header>
      <p className="admin-shipping-note">{fr ? "Configurez les montants TTC et les délais réels de vos transporteurs. Un tarif n’apparaît au paiement que si sa zone et le tarif sont actifs. Désactivez un tarif pour le retirer sans modifier les anciennes commandes." : "Nastavite dejanske cene z DDV in dobavne roke prevoznikov. Tarifa je vidna ob zaključku nakupa le, ko sta območje in tarifa aktivna. Tarifo deaktivirajte, da jo skrijete brez spreminjanja preteklih naročil."}</p>
      <div className="admin-shipping-layout"><div className="admin-shipping-list">{data.rates.map((item) => <button className={item.id === rateId ? "is-selected" : undefined} key={item.id} onClick={() => setRateId(item.id)} type="button"><span><strong>{item.name}</strong><small>{data.zones.find((value) => value.id === item.zoneId)?.name} · {item.estimatedDaysMin ?? "—"}–{item.estimatedDaysMax ?? "—"} {fr ? "jours ouvrés" : "delovnih dni"}</small></span><span><strong>{formatMoney(item.priceCents)}</strong><small>{item.active ? fr ? "Actif" : "Aktivno" : fr ? "Inactif" : "Neaktivno"}</small></span></button>)}{data.rates.length === 0 ? <p className="admin-operational-empty card">{fr ? "Aucun tarif configuré. Créez une zone Slovénie, puis votre premier tarif." : "Ni nastavljenih tarif. Ustvarite območje Slovenija in nato prvo tarifo."}</p> : null}</div>{canManage && data.zones.length > 0 ? <RateForm key={`${rate?.id ?? "new"}:${rate?.updatedAt ?? ""}`} rate={rate} zones={data.zones} /> : null}</div>
    </section>
    <section className="admin-shipping-section">
      <header><h2>{fr ? "Zones de livraison" : "Območja dostave"}</h2>{canManage ? <button className="button button-secondary" onClick={() => setZoneId("")} type="button"><Plus size={17} />{fr ? "Nouvelle zone" : "Novo območje"}</button> : null}</header>
      <div className="admin-shipping-layout"><div className="admin-shipping-list">{data.zones.map((item) => <button className={item.id === zoneId ? "is-selected" : undefined} key={item.id} onClick={() => setZoneId(item.id)} type="button"><span><strong><MapPin size={15} aria-hidden="true" /> {item.name}</strong><small>{item.countryCodes.join(", ")}</small></span><span>{item.active ? fr ? "Active" : "Aktivno" : fr ? "Inactive" : "Neaktivno"}</span></button>)}</div>{canManage ? <ZoneForm key={`${zone?.id ?? "new"}:${zone?.updatedAt ?? ""}`} zone={zone} /> : null}</div>
    </section>
  </div>;
}

function ZoneForm({ zone }: { zone?: AdminShippingZone }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [state, action, pending] = useActionState(saveAdminShippingZone, initialOrderActionState);
  return <form action={action} className="admin-shipping-editor card"><h2>{zone ? fr ? "Modifier la zone" : "Uredi območje" : fr ? "Créer une zone" : "Ustvari območje"}</h2>
    <input name="adminLocale" type="hidden" value={locale} /><input name="id" type="hidden" value={zone?.id ?? ""} /><input name="expectedUpdatedAt" type="hidden" value={zone?.updatedAt ?? ""} />
    <fieldset disabled={pending}><label><span>{fr ? "Nom" : "Ime"}</span><input defaultValue={zone?.name ?? "Slovenija"} maxLength={120} minLength={2} name="name" required /></label><p>{fr ? "Pays desservi : Slovénie (SI)." : "Država dostave: Slovenija (SI)."}</p><label className="admin-order-check"><input defaultChecked={zone?.active ?? false} name="active" type="checkbox" /><span>{fr ? "Zone active" : "Aktivno območje"}</span></label><button className="button button-primary" disabled={pending} type="submit"><Save size={16} />{pending ? fr ? "Enregistrement…" : "Shranjevanje…" : fr ? "Enregistrer la zone" : "Shrani območje"}</button></fieldset>
    {state.message ? <p aria-live="polite" className={`admin-operation-message is-${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
  </form>;
}

function RateForm({ rate, zones }: { rate?: AdminShippingRate; zones: AdminShippingZone[] }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [state, action, pending] = useActionState(saveAdminShippingRate, initialOrderActionState);
  return <form action={action} className="admin-shipping-editor card"><h2>{rate ? fr ? "Modifier le tarif" : "Uredi tarifo" : fr ? "Créer un tarif" : "Ustvari tarifo"}</h2>
    <input name="adminLocale" type="hidden" value={locale} /><input name="id" type="hidden" value={rate?.id ?? ""} /><input name="expectedUpdatedAt" type="hidden" value={rate?.updatedAt ?? ""} />
    <fieldset disabled={pending}><label><span>{fr ? "Zone" : "Območje"}</span><select defaultValue={rate?.zoneId ?? zones[0]?.id} name="zoneId" required>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}{zone.active ? "" : fr ? " (inactive)" : " (neaktivno)"}</option>)}</select></label><label><span>{fr ? "Nom affiché au client" : "Ime, vidno kupcu"}</span><input defaultValue={rate?.name ?? ""} maxLength={120} minLength={2} name="name" required /></label><label><span>{fr ? "Prix TTC (€)" : "Cena z DDV (€)"}</span><input defaultValue={rate ? (rate.priceCents / 100).toFixed(2) : ""} inputMode="decimal" name="price" pattern="[0-9]{1,5}([.,][0-9]{1,2})?" required /><small>{fr ? "Saisissez 0 pour une livraison gratuite." : "Za brezplačno dostavo vnesite 0."}</small></label><div className="admin-order-form-grid"><label><span>{fr ? "Délai minimum (jours ouvrés)" : "Najmanjši rok (delovni dnevi)"}</span><input defaultValue={rate?.estimatedDaysMin ?? ""} max={90} min={1} name="estimatedDaysMin" required type="number" /></label><label><span>{fr ? "Délai maximum (jours ouvrés)" : "Najdaljši rok (delovni dnevi)"}</span><input defaultValue={rate?.estimatedDaysMax ?? ""} max={90} min={1} name="estimatedDaysMax" required type="number" /></label></div><label className="admin-order-check"><input defaultChecked={rate?.active ?? false} name="active" type="checkbox" /><span>{fr ? "Tarif actif" : "Aktivna tarifa"}</span></label><button className="button button-primary" disabled={pending} type="submit"><Save size={16} />{pending ? fr ? "Enregistrement…" : "Shranjevanje…" : fr ? "Enregistrer le tarif" : "Shrani tarifo"}</button></fieldset>
    {state.message ? <p aria-live="polite" className={`admin-operation-message is-${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
  </form>;
}
