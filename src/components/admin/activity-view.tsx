"use client";
import { useState } from "react";
import { useAdminLanguage } from "./admin-i18n";
import type { ActivityEntry } from "@/lib/admin/activity-repository";
import "./operations.css";
export function ActivityView({ entries }: { entries: ActivityEntry[] | null }) {
  const { locale } = useAdminLanguage(); const fr = locale === "fr";
  const [search, setSearch] = useState("");
  const filtered = entries?.filter(x => `${x.action} ${x.entity_type} ${x.actor}`.toLowerCase().includes(search.toLowerCase()));
  return <><header className="admin-page-heading"><div><p className="section-kicker">Bistrava</p><h1>{fr ? "Journal d’activité" : "Dnevnik dejavnosti"}</h1><p>{fr ? "Les 100 dernières modifications enregistrées, avec leur auteur et leur date." : "Zadnjih 100 zabeleženih sprememb z avtorjem in datumom."}</p></div></header><section className="admin-dashboard-panel card"><label htmlFor="activity-search">{fr ? "Rechercher une action ou un administrateur" : "Poiščite dejanje ali skrbnika"}</label><input id="activity-search" className="ops-search" value={search} onChange={e => setSearch(e.target.value)} /><div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>{fr ? "Date" : "Datum"}</th><th>{fr ? "Auteur" : "Avtor"}</th><th>{fr ? "Action" : "Dejanje"}</th><th>{fr ? "Objet" : "Predmet"}</th></tr></thead><tbody>{filtered?.map(entry => <tr key={entry.id}><td>{new Date(entry.created_at).toLocaleString(fr ? "fr-FR" : "sl-SI", { timeZone: "Europe/Ljubljana" })}</td><td>{entry.actor}</td><td><code>{entry.action}</code></td><td>{entry.entity_type}<small>{entry.entity_id}</small></td></tr>)}</tbody></table></div>{!filtered?.length ? <p className="ops-empty">{entries === null ? (fr ? "Le journal est momentanément indisponible." : "Dnevnik trenutno ni na voljo.") : (fr ? "Aucune action à afficher." : "Ni dejanj za prikaz.")}</p> : null}</section></>;
}
