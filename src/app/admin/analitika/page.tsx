import type { Metadata } from "next";

import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Analitika · Administracija" };
export const dynamic = "force-dynamic";

export default function AdminAnalyticsPage() {
  const gtmConnected = Boolean(process.env.NEXT_PUBLIC_GTM_ID);

  return (
    <AdminSectionPage
      checks={[
        { complete: true, title: { sl: "Privzeto zavrnjeno soglasje", fr: "Consentement refusé par défaut" }, description: { sl: "Analitična in oglaševalska hramba sta blokirani do izbire.", fr: "Le stockage analytique et publicitaire reste bloqué avant le choix." } },
        { complete: gtmConnected, title: { sl: "Google Tag Manager", fr: "Google Tag Manager" }, description: gtmConnected ? { sl: "Identifikator GTM je nastavljen.", fr: "L’identifiant GTM est configuré." } : { sl: "Dodajte NEXT_PUBLIC_GTM_ID, ko bo merjenje potrjeno.", fr: "Ajoutez NEXT_PUBLIC_GTM_ID lorsque le plan de mesure sera validé." } },
        { complete: false, title: { sl: "Prodajni dogodki", fr: "Événements commerciaux" }, description: { sl: "Purchase in generate_lead se potrdita pred objavo.", fr: "purchase et generate_lead seront validés avant publication." } },
      ]}
      items={[
        { title: "Ogled izdelka", meta: { sl: "Merjenje zanimanja po izdelku in kategoriji.", fr: "Mesure de l’intérêt par produit et catégorie." }, status: { sl: "Načrtovano", fr: "Planifié" }, statusTone: "neutral" },
        { title: "Začetek zaključka nakupa", meta: { sl: "Dogodek ob prehodu iz košarice na blagajno.", fr: "Événement lors du passage du panier au paiement." }, status: { sl: "Načrtovano", fr: "Planifié" }, statusTone: "neutral" },
        { title: "Oddano povpraševanje", meta: { sl: "Glavna konverzija za svetovanje in montažo.", fr: "Conversion principale pour le conseil et l’installation." }, status: { sl: "Načrtovano", fr: "Planifié" }, statusTone: "neutral" },
      ]}
      metrics={[
        { value: "0", label: { sl: "sej danes", fr: "sessions aujourd’hui" }, detail: { sl: "Merjenje še ni aktivirano", fr: "La mesure n’est pas activée" }, tone: "teal" },
        { value: "0", label: { sl: "ogledov izdelkov", fr: "vues produit" }, detail: { sl: "Dogodek čaka na GTM", fr: "L’événement attend GTM" }, tone: "navy" },
        { value: "0", label: { sl: "konverzij", fr: "conversions" }, detail: { sl: "Pred začetkom kampanj", fr: "Avant le lancement des campagnes" }, tone: "amber" },
        { value: gtmConnected ? "Da" : "Ne", label: { sl: "GTM povezan", fr: "GTM connecté" }, detail: { sl: "Soglasje ostaja obvezno", fr: "Le consentement reste obligatoire" }, tone: "soft" },
      ]}
      section="analytics"
    />
  );
}
