"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus, Tag, Archive, Pencil, TicketPercent } from "lucide-react";
import { saveAdminPromotion, archiveAdminPromotion } from "@/actions/admin-promotions";
import { useAdminLanguage } from "@/components/admin/admin-i18n";
import { initialPromotionState, promotionStatus, type AdminPromotion } from "@/lib/admin/promotions";
import { formatMoney } from "@/lib/commerce/money";
import styles from "./admin-promotions.module.css";

function localDate(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function isoDate(value: string) { return value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : ""; }
function cents(value: string) { return /^\d+(?:[.,]\d{1,2})?$/.test(value) ? Math.round(Number(value.replace(",", ".")) * 100) : ""; }

function PromotionEditor({ promotion, onClose }: { promotion?: AdminPromotion; onClose: () => void }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const code = promotion?.codes[0];
  const [state, action, pending] = useActionState(saveAdminPromotion, initialPromotionState);
  const [type, setType] = useState(promotion?.type === "fixed" ? "fixed" : "percentage");
  const [value, setValue] = useState(promotion ? String(promotion.value / (promotion.type === "fixed" ? 100 : 1)) : "");
  const [minimum, setMinimum] = useState(promotion?.minimumOrderCents == null ? "" : String(promotion.minimumOrderCents / 100));
  const [starts, setStarts] = useState(localDate(promotion?.startsAt ?? null));
  const [ends, setEnds] = useState(localDate(promotion?.endsAt ?? null));
  const error = (field: string) => state.fieldErrors?.[field]?.[0] ? <small className={styles.error}>{state.fieldErrors[field][0]}</small> : null;
  return <form action={action} className={styles.editor}>
    <div className={styles.editorHeading}><div><p className="section-kicker">{fr ? "Paramètres" : "Nastavitve"}</p><h2>{promotion ? (fr ? "Modifier la promotion" : "Uredi promocijo") : (fr ? "Nouvelle promotion" : "Nova promocija")}</h2></div><button type="button" className="button button-secondary" onClick={onClose}>{fr ? "Fermer" : "Zapri"}</button></div>
    <input type="hidden" name="id" value={promotion?.id ?? ""} /><input type="hidden" name="codeId" value={code?.id ?? ""} /><input type="hidden" name="expectedUpdatedAt" value={promotion?.updatedAt ?? ""} />
    <div className={styles.grid}>
      <label>{fr ? "Nom interne" : "Interno ime"}<input name="name" required minLength={2} maxLength={120} defaultValue={promotion?.name} />{error("name")}</label>
      <label>{fr ? "Code promotionnel" : "Promocijska koda"}<input name="code" required pattern="[A-Za-z0-9_-]{3,40}" minLength={3} maxLength={40} defaultValue={code?.code} autoCapitalize="characters" />{error("code")}</label>
      <label>{fr ? "Type de réduction" : "Vrsta popusta"}<select name="type" value={type} onChange={(event) => setType(event.target.value)}><option value="percentage">{fr ? "Pourcentage (%)" : "Odstotek (%)"}</option><option value="fixed">{fr ? "Montant fixe (€)" : "Fiksni znesek (€)"}</option></select></label>
      <label>{type === "fixed" ? (fr ? "Réduction en euros" : "Popust v evrih") : (fr ? "Pourcentage (1 à 100)" : "Odstotek (1–100)")}<input type="number" min={type === "fixed" ? "0.01" : "1"} max={type === "fixed" ? "1000000" : "100"} step={type === "fixed" ? "0.01" : "1"} required value={value} onChange={(event) => setValue(event.target.value)} />{error("value")}<input type="hidden" name="value" value={type === "fixed" ? cents(value) : value} /></label>
      <label>{fr ? "Début (heure locale de votre appareil)" : "Začetek (lokalni čas naprave)"}<input type="datetime-local" value={starts} onChange={(event) => setStarts(event.target.value)} /><input type="hidden" name="startsAt" value={isoDate(starts)} />{error("startsAt")}</label>
      <label>{fr ? "Fin, exclue (heure locale)" : "Konec, izključno (lokalni čas)"}<input type="datetime-local" value={ends} onChange={(event) => setEnds(event.target.value)} /><input type="hidden" name="endsAt" value={isoDate(ends)} />{error("endsAt")}</label>
      <label>{fr ? "Panier minimum en euros, hors livraison" : "Najmanjša vrednost izdelkov v evrih"}<input type="number" min="0" step="0.01" value={minimum} onChange={(event) => setMinimum(event.target.value)} /><input type="hidden" name="minimumOrderCents" value={minimum ? cents(minimum) : ""} />{error("minimumOrderCents")}</label>
      <label>{fr ? "Utilisations maximales de la promotion" : "Največ uporab promocije"}<input name="usageLimit" type="number" min={promotion?.usedCount ?? 0} max="1000000" step="1" defaultValue={promotion?.usageLimit ?? ""} />{error("usageLimit")}</label>
      <label>{fr ? "Utilisations maximales de ce code" : "Največ uporab te kode"}<input name="codeUsageLimit" type="number" min={code?.usedCount ?? 0} max="1000000" step="1" defaultValue={code?.usageLimit ?? ""} />{error("codeUsageLimit")}</label>
    </div>
    <label>{fr ? "Description interne" : "Interni opis"}<textarea name="description" rows={3} maxLength={1000} defaultValue={promotion?.description ?? ""} /></label>
    <div className={styles.toggles}><label><input type="checkbox" name="active" defaultChecked={promotion?.active ?? false} />{fr ? "Promotion active" : "Aktivna promocija"}</label><label><input type="checkbox" name="codeActive" defaultChecked={code?.active ?? true} />{fr ? "Code actif" : "Aktivna koda"}</label></div>
    <p className={styles.help}>{fr ? "Laissez les dates et limites vides pour ne pas les limiter. Un seul code par commande, sur les produits TTC, hors livraison. Une annulation avant paiement libère son utilisation." : "Prazni datumi in omejitve pomenijo brez omejitve. Ena koda na naročilo, za izdelke z DDV, brez dostave. Preklic pred plačilom sprosti uporabo."}</p>
    {promotion && promotion.codes.length > 1 ? <p className={styles.help}>{fr ? "Cette promotion possède plusieurs codes. Les règles communes s’appliquent à tous ; seul le premier code est modifié ici." : "Promocija ima več kod. Skupna pravila veljajo za vse; tukaj urejate prvo kodo."}</p> : null}
    <p role="status" className={state.status === "error" ? styles.error : styles.success}>{state.message}</p>
    <button className="button button-primary" disabled={pending} type="submit">{pending ? (fr ? "Enregistrement…" : "Shranjevanje…") : (fr ? "Enregistrer" : "Shrani promocijo")}</button>
  </form>;
}

export function AdminPromotionsView({ data, canEdit }: { data: { promotions: AdminPromotion[]; connected: boolean }; canEdit: boolean }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const statusNames = fr ? { active: "Active", inactive: "Inactive", scheduled: "Planifiée", expired: "Expirée", exhausted: "Limite atteinte", archived: "Archivée" } : { active: "Aktivna", inactive: "Neaktivna", scheduled: "Načrtovana", expired: "Potekla", exhausted: "Porabljena", archived: "Arhivirana" };
  const shown = data.promotions.filter((item) => `${item.name} ${item.codes.map((code) => code.code).join(" ")}`.toLowerCase().includes(filter.toLowerCase()));
  const selectedPromotion = data.promotions.find((item) => item.id === selected);
  return <div className={styles.page}>
    <header className={styles.header}><div><p className="section-kicker">{fr ? "Ventes" : "Prodaja"}</p><h1>{fr ? "Promotions" : "Promocije"}</h1><p>{fr ? "Créez des codes, maîtrisez leur durée et suivez leur utilisation réelle." : "Ustvarite kode, določite veljavnost in spremljajte dejansko uporabo."}</p></div><button className="button button-primary" disabled={!canEdit || !data.connected} onClick={() => setSelected("new")}><Plus size={18} />{fr ? "Nouvelle promotion" : "Nova promocija"}</button></header>
    <div className={styles.metrics}><div><TicketPercent /><strong>{data.promotions.filter((item) => promotionStatus(item) === "active").length}</strong><span>{fr ? "Promotions actives" : "Aktivne promocije"}</span></div><div><Tag /><strong>{data.promotions.reduce((sum, item) => sum + item.usedCount, 0)}</strong><span>{fr ? "Utilisations réservées ou finalisées" : "Rezervirane ali zaključene uporabe"}</span></div></div>
    {!data.connected ? <p role="alert" className={styles.notice}>{fr ? "Les données Supabase sont indisponibles. Aucune promotion de démonstration n’est créée." : "Podatki Supabase niso dosegljivi. Prikaz ne ustvarja vzorčnih promocij."}</p> : !canEdit ? <p className={styles.notice}>{fr ? "Lecture seule : les modifications sont réservées aux administrateurs." : "Samo ogled: spremembe so dovoljene administratorjem."}</p> : null}
    {selected && canEdit && data.connected ? <PromotionEditor key={`${selected}:${selectedPromotion?.updatedAt ?? "new"}`} promotion={selectedPromotion} onClose={() => setSelected(null)} /> : null}
    <section className={styles.list}><label className={styles.search}>{fr ? "Rechercher un nom ou un code" : "Poiščite ime ali kodo"}<input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} /></label>
      {shown.length === 0 ? <div className={styles.empty}><TicketPercent size={36} /><h2>{fr ? "Aucune promotion" : "Ni promocij"}</h2><p>{fr ? "Vos campagnes apparaîtront ici après leur création." : "Vaše kampanje se bodo po ustvarjanju prikazale tukaj."}</p></div> : <div className={styles.tableWrap}><table><thead><tr><th>{fr ? "Promotion / code" : "Promocija / koda"}</th><th>{fr ? "Réduction" : "Popust"}</th><th>{fr ? "État" : "Stanje"}</th><th>{fr ? "Utilisations" : "Uporabe"}</th><th>{fr ? "Validité" : "Veljavnost"}</th><th>{fr ? "Actions" : "Dejanja"}</th></tr></thead><tbody>{shown.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><span className={styles.codes}>{item.codes.map((code) => `${code.code}${!code.active ? (fr ? " (inactif)" : " (neaktivna)") : ""}`).join(", ") || "—"}</span></td><td>{item.type === "percentage" ? `${item.value} %` : formatMoney(item.value)}{item.minimumOrderCents !== null ? <small>{fr ? "Dès " : "Od "}{formatMoney(item.minimumOrderCents)}</small> : null}</td><td><span className={styles.badge} data-active={promotionStatus(item) === "active"}>{statusNames[promotionStatus(item)]}</span></td><td>{item.usedCount} / {item.usageLimit ?? "∞"}<small>{item.codes.map((code) => `${code.code}: ${code.usedCount}/${code.usageLimit ?? "∞"}`).join(" · ")}</small></td><td>{item.startsAt ? new Date(item.startsAt).toLocaleDateString(fr ? "fr-FR" : "sl-SI") : "—"}<small>{item.endsAt ? new Date(item.endsAt).toLocaleDateString(fr ? "fr-FR" : "sl-SI") : (fr ? "Sans fin" : "Brez konca")}</small></td><td>{canEdit && !item.archivedAt && ["percentage", "fixed"].includes(item.type) ? <div className={styles.actions}><button type="button" onClick={() => setSelected(item.id)} aria-label={`${fr ? "Modifier" : "Uredi"} ${item.name}`}><Pencil size={16} /></button><button type="button" onClick={() => setArchiveId(item.id)} aria-label={`${fr ? "Archiver" : "Arhiviraj"} ${item.name}`}><Archive size={16} /></button>{archiveId === item.id ? <div className={styles.confirm}><span>{fr ? "Désactiver et archiver cette promotion ?" : "Deaktiviram in arhiviram promocijo?"}</span><button disabled={pending} onClick={() => startTransition(async () => { const result = await archiveAdminPromotion(item.id, item.updatedAt); setMessage(result.message); if (result.status === "success") { setArchiveId(null); setSelected(null); } })}>{fr ? "Confirmer" : "Potrdi"}</button><button onClick={() => setArchiveId(null)}>{fr ? "Annuler" : "Prekliči"}</button></div> : null}</div> : "—"}</td></tr>)}</tbody></table></div>}
    </section><p role="status">{message}</p>
  </div>;
}
