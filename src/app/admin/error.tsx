"use client";

import { useAdminLanguage } from "@/components/admin/admin-i18n";

export default function AdminError({ reset }: { reset: () => void }) {
  const { locale } = useAdminLanguage();
  return <section className="admin-content"><div className="admin-panel card" role="alert">
    <h1>{locale === "fr" ? "Chargement interrompu" : "Nalaganje je bilo prekinjeno"}</h1>
    <p>{locale === "fr" ? "Les données ne sont pas disponibles pour le moment. Réessayez pour afficher les informations à jour." : "Podatki trenutno niso na voljo. Poskusite znova za prikaz trenutnih podatkov."}</p>
    <button className="button button-primary" onClick={reset}>{locale === "fr" ? "Réessayer" : "Poskusite znova"}</button>
  </div></section>;
}
