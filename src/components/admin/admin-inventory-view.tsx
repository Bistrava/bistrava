"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adjustAdminInventory } from "@/actions/admin-products";
import { initialAdminProductActionState } from "@/lib/forms/action-state";
import { useAdminLanguage } from "@/components/admin/admin-i18n";
import type { AdminProductSummary } from "@/lib/admin/catalog-dashboard";
import type { AdminInventoryMovement } from "@/lib/admin/inventory-repository";
import "./product-admin.css";

function InventoryAdjustment({ product, canEdit }: { product: AdminProductSummary; canEdit: boolean }) {
  const { locale } = useAdminLanguage(); const fr = locale === "fr";
  const [state, action, pending] = useActionState(adjustAdminInventory, initialAdminProductActionState);
  const router = useRouter();
  useEffect(() => { if (state.status === "success") router.refresh(); }, [state, router]);
  return <form action={action} className="admin-stock-adjustment">
    <input type="hidden" name="slug" value={product.slug} /><input type="hidden" name="expectedQuantity" value={product.stockQuantity} /><input type="hidden" name="adminLocale" value={locale} />
    <h2>{fr ? "Ajuster le stock" : "Popravek zaloge"}</h2><p><strong>{product.name}</strong><br />{product.sku} · {fr ? "Stock actuel" : "Trenutna zaloga"} : {product.stockQuantity}</p>
    <label className="admin-editor-field"><span>{fr ? "Nouvelle quantité totale" : "Nova skupna količina"}</span><input type="number" name="quantity" required min="0" max="10000000" step="1" defaultValue={product.stockQuantity} disabled={!canEdit || pending} /></label>
    <label className="admin-editor-field"><span>{fr ? "Disponibilité" : "Razpoložljivost"}</span><select name="stockStatus" defaultValue={product.stockStatus} disabled={!canEdit || pending}><option value="in_stock">{fr ? "En stock" : "Na zalogi"}</option><option value="out_of_stock">{fr ? "Rupture de stock" : "Ni na zalogi"}</option><option value="backorder">{fr ? "Sur commande" : "Po naročilu"}</option><option value="unverified">{fr ? "Non vérifié" : "Nepreverjeno"}</option></select></label>
    <label className="admin-editor-field"><span>{fr ? "Motif du changement" : "Razlog spremembe"}</span><textarea name="note" required minLength={3} maxLength={500} rows={3} placeholder={fr ? "Ex. réception de 10 unités du fournisseur" : "Npr. prejem 10 kosov od dobavitelja"} disabled={!canEdit || pending} /></label>
    <button className="button button-primary" disabled={!canEdit || pending}>{pending ? (fr ? "Enregistrement…" : "Shranjevanje …") : (fr ? "Enregistrer le stock" : "Shrani zalogo")}</button>
    {state.message ? <p role="status">{state.message}</p> : null}
    <Link href={`/admin/izdelki/${product.slug}`} className="text-link">{fr ? "Modifier la fiche complète" : "Uredi celoten izdelek"}</Link>
  </form>;
}

export function AdminInventoryView({ products, movements, canEdit }: { products: AdminProductSummary[]; movements: AdminInventoryMovement[]; canEdit: boolean }) {
  const { locale } = useAdminLanguage(); const fr = locale === "fr";
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState("all"); const [slug, setSlug] = useState(products.find((p) => p.status !== "archived")?.slug ?? "");
  const current = products.filter((p) => p.status !== "archived");
  const low = current.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5);
  const empty = current.filter((p) => p.stockQuantity === 0);
  const selected = products.find((p) => p.slug === slug);
  const shown = current.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || (filter === "low" && p.stockQuantity <= 5) || (filter === "empty" && p.stockQuantity === 0)));
  return <>
    <header className="admin-page-heading"><div><p className="section-kicker">{fr ? "Inventaire" : "Zaloga"}</p><h1>{fr ? "Stocks et mouvements" : "Zaloga in premiki"}</h1><p>{fr ? "Quantités en temps réel, alertes et historique des ajustements." : "Trenutne količine, opozorila in zgodovina sprememb."}</p></div></header>
    <section className="admin-catalog-summary"><div><strong>{current.length}</strong><span>{fr ? "Produits" : "Izdelki"}</span></div><div><strong>{current.reduce((sum, p) => sum + p.stockQuantity, 0)}</strong><span>{fr ? "Unités" : "Kosi"}</span></div><div><strong>{low.length}</strong><span>{fr ? "Stock faible (1 à 5)" : "Nizka zaloga (1–5)"}</span></div><div><strong>{empty.length}</strong><span>{fr ? "Sans stock" : "Brez zaloge"}</span></div></section>
    <div className="admin-stock-filters"><input aria-label={fr ? "Rechercher un produit" : "Poišči izdelek"} placeholder={fr ? "Nom ou SKU…" : "Ime ali SKU …"} value={query} onChange={(e) => setQuery(e.target.value)} /><select aria-label={fr ? "Filtrer le stock" : "Filtriraj zalogo"} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">{fr ? "Tout le stock" : "Vsa zaloga"}</option><option value="low">{fr ? "5 unités ou moins" : "5 kosov ali manj"}</option><option value="empty">{fr ? "Sans stock" : "Brez zaloge"}</option></select></div>
    <div className="admin-stock-grid"><section className="admin-panel card admin-stock-table-wrap"><table className="admin-stock-table"><thead><tr><th>{fr ? "Produit" : "Izdelek"}</th><th>{fr ? "Quantité" : "Količina"}</th><th>{fr ? "Actions" : "Dejanja"}</th></tr></thead><tbody>{shown.map((p) => <tr key={p.slug}><td><strong>{p.name}</strong><br /><small>{p.sku}</small></td><td className={p.stockQuantity <= 5 ? "admin-stock-low" : undefined}>{p.stockQuantity}</td><td><button className="button button-secondary" onClick={() => setSlug(p.slug)}>{fr ? "Ajuster" : "Uredi"}</button></td></tr>)}</tbody></table>{shown.length === 0 ? <p>{fr ? "Aucun produit ne correspond." : "Ni ustreznih izdelkov."}</p> : null}</section><section className="admin-panel card">{selected ? <InventoryAdjustment key={`${selected.slug}:${selected.stockQuantity}:${selected.stockStatus}`} product={selected} canEdit={canEdit} /> : <p>{fr ? "Choisissez un produit." : "Izberite izdelek."}</p>}</section></div>
    <section className="admin-panel card" style={{ marginTop: "1.5rem" }}><h2>{fr ? "Derniers mouvements" : "Zadnji premiki"}</h2><p>{fr ? "Les 50 derniers mouvements de stock, commandes comprises." : "Zadnjih 50 premikov zaloge, vključno z naročili."}</p><ul className="admin-stock-journal">{movements.map((m) => <li key={m.id}><strong>{m.delta > 0 ? "+" : ""}{m.delta}</strong> · {m.product} <small>{m.sku} · {fr ? "Solde" : "Stanje"} : {m.balance} · {new Date(m.createdAt).toLocaleString(fr ? "fr-FR" : "sl-SI", { timeZone: "Europe/Ljubljana" })} · {m.note || m.reason}</small></li>)}</ul>{movements.length === 0 ? <p>{fr ? "Aucun mouvement enregistré pour le moment." : "Trenutno ni zabeleženih premikov."}</p> : null}</section>
  </>;
}
