"use client";

import Link from "next/link";
import { BookOpenText, Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useAdminLanguage } from "@/components/admin/admin-i18n";
import type { AdminGuide } from "@/lib/admin/guide-editor";
import "@/components/admin/guide-admin.css";

export function AdminGuidesView({ guides, available, canManage }: { guides: AdminGuide[]; available: boolean; canManage: boolean }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const statuses = fr ? { draft: "Brouillon", published: "Publié", archived: "Archivé" } : { draft: "Osnutek", published: "Objavljeno", archived: "Arhivirano" };
  const filtered = guides.filter((guide) => (status === "all" || guide.status === status) && `${guide.title} ${guide.slug}`.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)));
  return <div className="admin-guide-cms">
    <header className="admin-page-heading"><div><p className="section-kicker">{fr ? "Contenu de la boutique" : "Vsebina trgovine"}</p><h1>{fr ? "Guides et conseils" : "Vodniki in nasveti"}</h1><p>{fr ? "Rédigez les articles en slovène, gérez leurs tableaux et choisissez leur publication." : "Pišite članke v slovenščini, urejajte tabele in določite objavo."}</p></div>{canManage ? <Link className="button button-primary" href="/admin/vodici/nov"><Plus size={17} />{fr ? "Créer un guide" : "Nov vodnik"}</Link> : null}</header>
    {!available ? <p className="admin-operation-message is-error" role="alert">{fr ? "Les guides ne sont pas disponibles. Vérifiez la connexion Supabase." : "Vodniki niso na voljo. Preverite povezavo Supabase."}</p> : null}
    <div className="admin-guide-filters card"><label><span><Search size={16} />{fr ? "Rechercher" : "Išči"}</span><input onChange={(event) => setQuery(event.target.value)} type="search" value={query} /></label><label><span>{fr ? "Publication" : "Objava"}</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{fr ? "Tous les statuts" : "Vsi statusi"}</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <div className="admin-guide-list">{filtered.map((guide) => <article className="card" key={guide.id}><BookOpenText size={25} aria-hidden="true" /><div><span className="eyebrow">{statuses[guide.status]}</span><h2>{guide.title}</h2><p>{guide.excerpt}</p><small>{guide.sections.length} {fr ? "sections" : "poglavij"} · {guide.readingTime} · {guide.updatedAt}</small></div><Link className="button button-secondary" href={`/admin/vodici/${guide.id}`}><Pencil size={16} />{fr ? "Ouvrir" : "Odpri"}</Link></article>)}</div>
    {available && filtered.length === 0 ? <p className="admin-operational-empty card">{fr ? "Aucun guide ne correspond à la sélection." : "Noben vodnik ne ustreza izboru."}</p> : null}
  </div>;
}
