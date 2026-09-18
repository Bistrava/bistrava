import type { Metadata } from "next";

import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "E-pošta · Administracija" };
export const dynamic = "force-dynamic";

export default function AdminEmailPage() {
  const resendConnected = Boolean(process.env.RESEND_API_KEY);

  return (
    <AdminSectionPage
      checks={[
        { complete: resendConnected, title: { sl: "Povezava Resend", fr: "Connexion Resend" }, description: resendConnected ? { sl: "API ključ je nastavljen v okolju.", fr: "La clé API est configurée dans l’environnement." } : { sl: "Po ustvarjanju računa dodajte RESEND_API_KEY.", fr: "Ajoutez RESEND_API_KEY après la création du compte." } },
        { complete: false, title: { sl: "Preverjena pošiljateljska domena", fr: "Domaine d’expédition vérifié" }, description: { sl: "Domeno bomo preverili po njenem nakupu.", fr: "Le domaine sera vérifié après son achat." } },
        { complete: true, title: { sl: "Varno pošiljanje", fr: "Envoi sécurisé" }, description: { sl: "Strežniški modul ne razkriva API ključa brskalniku.", fr: "Le module serveur n’expose jamais la clé API au navigateur." } },
      ]}
      items={[
        { title: "Potrditev naročila", meta: { sl: "Kupcu po uspešnem oddanem naročilu.", fr: "Envoyé au client après une commande réussie." }, status: { sl: "Predloga pripravljena", fr: "Modèle prêt" }, statusTone: "ready" },
        { title: "Potrditev povpraševanja", meta: { sl: "Kupcu takoj po oddaji obrazca.", fr: "Envoyé au client immédiatement après le formulaire." }, status: { sl: "Predloga pripravljena", fr: "Modèle prêt" }, statusTone: "ready" },
        { title: "Obvestilo skrbniku", meta: { sl: "Interno opozorilo ob novem prodajnem stiku.", fr: "Alerte interne lors d’un nouveau contact commercial." }, status: { sl: "Čaka na Resend", fr: "En attente de Resend" }, statusTone: resendConnected ? "ready" : "waiting" },
      ]}
      metrics={[
        { value: 3, label: { sl: "tokovi sporočil", fr: "flux d’e-mails" }, detail: { sl: "Naročilo, povpraševanje in skrbnik", fr: "Commande, demande et administrateur" }, tone: "teal" },
        { value: 0, label: { sl: "poslanih danes", fr: "envoyés aujourd’hui" }, detail: { sl: "Pred začetkom prodaje", fr: "Avant le lancement des ventes" }, tone: "navy" },
        { value: resendConnected ? "Da" : "Ne", label: { sl: "Resend povezan", fr: "Resend connecté" }, detail: { sl: "Preverjeno brez prikaza skrivnosti", fr: "Vérifié sans exposer les secrets" }, tone: resendConnected ? "teal" : "amber" },
        { value: 0, label: { sl: "napak dostave", fr: "erreurs de livraison" }, detail: { sl: "Dnevnik bo na voljo po povezavi", fr: "Le journal sera disponible après connexion" }, tone: "soft" },
      ]}
      section="email"
    />
  );
}
