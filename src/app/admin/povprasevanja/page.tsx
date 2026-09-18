import type { Metadata } from "next";

import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Povpraševanja · Administracija" };
export const dynamic = "force-dynamic";

export default function AdminInquiriesPage() {
  return (
    <AdminSectionPage
      checks={[
        { complete: true, title: { sl: "Obrazec za svetovanje", fr: "Formulaire de conseil" }, description: { sl: "Zajema kontakt, trdoto, gospodinjstvo in pogoje montaže.", fr: "Il collecte le contact, la dureté, le foyer et les contraintes d’installation." } },
        { complete: false, title: { sl: "Varno shranjevanje", fr: "Enregistrement sécurisé" }, description: { sl: "Povežite tabelo quote_requests v Supabase.", fr: "Connectez la table quote_requests dans Supabase." } },
        { complete: false, title: { sl: "Samodejni odgovor", fr: "Réponse automatique" }, description: { sl: "Resend bo kupcu poslal potrdilo o prejemu.", fr: "Resend enverra au client un accusé de réception." } },
      ]}
      items={[
        { title: "Novo povpraševanje", meta: { sl: "Prispe iz javnega obrazca in se dodeli skrbniku.", fr: "Provient du formulaire public et est attribuée à un administrateur." }, status: { sl: "Čaka na povezavo", fr: "Connexion requise" }, statusTone: "waiting" },
        { title: "Prodajni potek", meta: { sl: "Novo → v obravnavi → ponudba poslana → zaključeno.", fr: "Nouvelle → en cours → devis envoyé → clôturée." }, status: { sl: "Pripravljeno", fr: "Prêt" }, statusTone: "ready" },
      ]}
      metrics={[
        { value: 0, label: { sl: "novih zahtev", fr: "nouvelles demandes" }, detail: { sl: "Živi podatki še niso povezani", fr: "Les données réelles ne sont pas connectées" }, tone: "teal" },
        { value: 0, label: { sl: "v obravnavi", fr: "en cours" }, detail: { sl: "Brez odprtih pogovorov", fr: "Aucune conversation ouverte" }, tone: "navy" },
        { value: 0, label: { sl: "čaka na ponudbo", fr: "en attente de devis" }, detail: { sl: "Prodajna vrsta je prazna", fr: "La file commerciale est vide" }, tone: "amber" },
        { value: "—", label: { sl: "odzivni čas", fr: "délai de réponse" }, detail: { sl: "Izračun po prvih zahtevah", fr: "Calculé après les premières demandes" }, tone: "soft" },
      ]}
      section="inquiries"
    />
  );
}
