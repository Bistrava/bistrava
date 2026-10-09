"use client";

import { useActionState, useCallback, useState } from "react";
import { saveAdminInquiry } from "@/actions/admin-inquiries";
import { useAdminLanguage } from "./admin-i18n";
import { AdminLiveUpdates, type AdminLiveTable } from "./live-updates";
import { AdminNotificationsSeen } from "./admin-notifications";
import "./operations.css";

export type AdminInquiry = { id: string; name: string; email: string; phone: string | null; message: string; status: string; internal_note: string | null; product_slug: string | null; created_at: string; updated_at: string };
const statuses = { new: { fr: "Nouveau", sl: "Novo" }, in_review: { fr: "En cours", sl: "V obravnavi" }, responded: { fr: "Répondu", sl: "Odgovorjeno" }, closed: { fr: "Clôturé", sl: "Zaključeno" } };
const liveTables: readonly AdminLiveTable[] = ["quote_requests"];

export function InquiriesView({ items, canManage, liveEnabled = true, initialInquiryId }: { items: AdminInquiry[] | null; canManage: boolean; liveEnabled?: boolean; initialInquiryId?: string }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [filter, setFilter] = useState("");
  const [draftItems, setDraftItems] = useState<Map<string, AdminInquiry>>(() => new Map());
  const onDraftChange = useCallback((item: AdminInquiry, dirty: boolean) => {
    setDraftItems(current => {
      if (current.has(item.id) === dirty) return current;
      const next = new Map(current);
      if (dirty) next.set(item.id, item);
      else next.delete(item.id);
      return next;
    });
  }, []);
  // Another card's server action can revalidate this list even while it has a draft.
  // Keep edited cards mounted if their remote status changes or they leave the last 100.
  const displayed = [...(items ?? [])];
  const presentIds = new Set(displayed.map(item => item.id));
  for (const item of draftItems.values()) if (!presentIds.has(item.id)) displayed.push(item);
  const visible = displayed.filter(item => item.id === initialInquiryId || draftItems.has(item.id) || !filter || item.status === filter);
  const paused = draftItems.size > 0;

  return (
    <>
      <header className="admin-page-heading"><div><p className="section-kicker">Bistrava</p><h1>{fr ? "Messages clients" : "Sporočila kupcev"}</h1><p>{fr ? "Consultez les demandes et suivez leur traitement. Les réponses s’envoient depuis votre messagerie." : "Preberite sporočila in spremljajte obravnavo. Odgovore pošljete iz svoje e-pošte."}</p></div></header>
      <AdminLiveUpdates tables={liveTables} paused={paused} disabled={!liveEnabled} />
      {liveEnabled ? <AdminNotificationsSeen category="inquiries" entityIds={visible.map(item => item.id)} /> : null}
      <div className="ops-form">
        <label>{fr ? "Statut" : "Stanje"}<select value={filter} onChange={event => setFilter(event.target.value)} disabled={paused}>
          <option value="">{fr ? "Tous" : "Vsa"}</option>
          {Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label[locale]}</option>)}
        </select></label>
      </div>
      <div className="ops-cards" style={{ marginTop: 20 }}>
        {visible.map(item => (
          <article key={item.id} id={`demande-${item.id}`} className="admin-dashboard-panel card">
            <h2>{item.name}</h2>
            <p><a href={`mailto:${item.email}`}>{item.email}</a>{item.phone ? ` · ${item.phone}` : ""}</p>
            <p className="ops-meta">{new Date(item.created_at).toLocaleDateString(fr ? "fr-FR" : "sl-SI")} · {item.product_slug ?? "Bistrava"}</p>
            <p style={{ whiteSpace: "pre-wrap" }}>{item.message}</p>
            {canManage ? <InquiryForm item={item} onDraftChange={onDraftChange} /> : <p>{statuses[item.status as keyof typeof statuses]?.[locale]}</p>}
          </article>
        ))}
      </div>
      {!visible.length ? <p className="ops-empty">{items === null ? (fr ? "Messages indisponibles pour le moment." : "Sporočila trenutno niso na voljo.") : (fr ? "Aucun message pour ce filtre." : "Za ta filter ni sporočil.")}</p> : null}
      <p className="ops-meta">{fr ? "100 messages les plus récents." : "Zadnjih 100 sporočil."}</p>
    </>
  );
}

type InquiryDraft = { status: string; note: string; source: { status: string; note: string; updatedAt: string } };

function InquiryForm({ item, onDraftChange }: { item: AdminInquiry; onDraftChange: (item: AdminInquiry, dirty: boolean) => void }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [draft, setDraft] = useState<InquiryDraft | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [state, action, pending] = useActionState(async (previous: { status: string }, form: FormData) => {
    let result: { status: string };
    try {
      result = await saveAdminInquiry(previous, form);
    } catch {
      result = { status: "error" };
    }
    setShowFeedback(true);
    if (result.status === "success") {
      setDraft(null);
      onDraftChange(item, false);
    }
    return result;
  }, { status: "idle" });

  const changeDraft = (field: "status" | "note", value: string) => {
    setShowFeedback(false);
    const current = draft ?? {
      status: item.status,
      note: item.internal_note ?? "",
      source: { status: item.status, note: item.internal_note ?? "", updatedAt: item.updated_at },
    };
    const next = { ...current, [field]: value };
    const dirty = next.status !== next.source.status || next.note !== next.source.note;
    setDraft(dirty ? next : null);
    onDraftChange(item, dirty);
  };
  const cancel = () => {
    setShowFeedback(false);
    setDraft(null);
    onDraftChange(item, false);
  };

  return (
    <form className="ops-form" action={action} aria-busy={pending} data-dirty={draft !== null}>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="updatedAt" value={draft?.source.updatedAt ?? item.updated_at} />
      <label>{fr ? "Statut" : "Stanje"}<select name="status" value={draft?.status ?? item.status} onChange={event => changeDraft("status", event.target.value)} disabled={pending}>
        {Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label[locale]}</option>)}
      </select></label>
      <label>{fr ? "Note interne" : "Interna opomba"}<textarea name="note" value={draft?.note ?? item.internal_note ?? ""} onChange={event => changeDraft("note", event.target.value)} maxLength={5000} disabled={pending} /></label>
      {showFeedback && state.status !== "idle" ? (
        <p role="status" className={`ops-notice ${state.status === "success" ? "" : "is-error"}`}>
          {state.status === "success" ? (fr ? "Enregistré." : "Shranjeno.")
            : state.status === "conflict" ? (fr ? "Cette demande a été modifiée ailleurs. Votre brouillon est conservé. Copiez vos notes si nécessaire, puis annulez pour charger la version récente." : "Zahteva je bila drugje spremenjena. Osnutek je ohranjen. Po potrebi kopirajte opombe in nato prekličite za nalaganje nove različice.")
            : (fr ? "Enregistrement impossible. Votre brouillon est conservé ; vous pouvez réessayer." : "Shranjevanje ni uspelo. Osnutek je ohranjen; poskusite znova.")}
        </p>
      ) : null}
      <div className="ops-form-actions">
        <button type="submit" disabled={pending || !draft} className="button button-primary">{pending ? (fr ? "Enregistrement…" : "Shranjevanje…") : (fr ? "Enregistrer" : "Shrani")}</button>
        {draft ? <button type="button" className="button button-secondary" disabled={pending} onClick={cancel}>{fr ? "Annuler les modifications" : "Prekliči spremembe"}</button> : null}
      </div>
    </form>
  );
}
