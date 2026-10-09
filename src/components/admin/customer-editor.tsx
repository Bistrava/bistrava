"use client";
import { useActionState, useState } from "react";
import { saveAdminCustomer } from "@/actions/admin-customers";
import type { AdminCustomerProfile } from "@/lib/admin/orders";
import { useAdminLanguage } from "./admin-i18n";
import "./operations.css";

export function CustomerEditor({ profiles }: { profiles: AdminCustomerProfile[] }) {
  const { locale } = useAdminLanguage(); const fr = locale === "fr";
  const [selected, setSelected] = useState(profiles[0]?.id ?? "");
  const profile = profiles.find(x => x.id === selected);
  if (!profiles.length) return null;
  return <section className="admin-dashboard-panel card" style={{ marginTop: 24 }}><h2>{fr ? "Coordonnées des comptes clients" : "Kontaktni podatki uporabniških računov"}</h2><div className="ops-form"><label>{fr ? "Compte à modifier" : "Račun za urejanje"}<select value={selected} onChange={e => setSelected(e.target.value)}>{profiles.map(p => <option key={p.id} value={p.id}>{p.fullName || p.email}</option>)}</select></label></div>{profile ? <CustomerForm key={`${profile.id}-${profile.updatedAt}`} profile={profile} /> : null}</section>;
}
function CustomerForm({ profile }: { profile: AdminCustomerProfile }) {
  const { locale } = useAdminLanguage(); const fr = locale === "fr";
  const [state, action, pending] = useActionState(saveAdminCustomer, { status: "idle" });
  return <form action={action} className="ops-form"><input type="hidden" name="id" value={profile.id} /><input type="hidden" name="updatedAt" value={profile.updatedAt} /><p className="ops-meta">{profile.email} · {fr ? "L’adresse de connexion et les anciennes commandes sont conservées." : "Prijavni naslov in pretekla naročila ostanejo nespremenjeni."}</p><div className="ops-form-grid"><label>{fr ? "Nom complet" : "Ime in priimek"}<input name="name" defaultValue={profile.fullName ?? ""} required maxLength={160} /></label><label>{fr ? "Téléphone" : "Telefon"}<input name="phone" type="tel" defaultValue={profile.phone ?? ""} maxLength={40} /></label><label>{fr ? "Langue" : "Jezik"}<select name="locale" defaultValue={profile.locale}><option value="sl-SI">Slovenščina</option><option value="fr-FR">Français</option><option value="en-GB">English</option></select></label></div>{state.status !== "idle" ? <p role="status" className={`ops-notice ${state.status === "success" ? "" : "is-error"}`}>{state.status === "success" ? (fr ? "Coordonnées enregistrées." : "Podatki so shranjeni.") : state.status === "conflict" ? (fr ? "Le compte a changé. Actualisez avant de réessayer." : "Račun je bil spremenjen. Osvežite stran.") : (fr ? "Enregistrement impossible. Vérifiez les champs et votre connexion." : "Shranjevanje ni uspelo. Preverite podatke in prijavo.")}</p> : null}<div><button disabled={pending} className="button button-primary">{pending ? "…" : fr ? "Enregistrer les coordonnées" : "Shrani kontaktne podatke"}</button></div></form>;
}
