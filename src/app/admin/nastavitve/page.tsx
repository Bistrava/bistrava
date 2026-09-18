import type { Metadata } from "next";

import { AdminSectionPage } from "@/components/admin/admin-section-page";

export const metadata: Metadata = { title: "Nastavitve · Administracija" };
export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const supabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const resend = Boolean(process.env.RESEND_API_KEY);
  const vercel = Boolean(process.env.VERCEL);
  const connected = [supabase, resend, vercel].filter(Boolean).length;

  return (
    <AdminSectionPage
      checks={[
        { complete: supabase, title: { sl: "Supabase", fr: "Supabase" }, description: supabase ? { sl: "URL in javni ključ sta nastavljena.", fr: "L’URL et la clé publique sont configurées." } : { sl: "Projekt še ni ustvarjen; konfiguracija ostaja zaprta.", fr: "Le projet n’est pas encore créé ; la configuration reste fermée." } },
        { complete: resend, title: { sl: "Resend", fr: "Resend" }, description: resend ? { sl: "API ključ je nastavljen.", fr: "La clé API est configurée." } : { sl: "Račun in pošiljateljska domena še nista povezana.", fr: "Le compte et le domaine d’expédition ne sont pas connectés." } },
        { complete: vercel, title: { sl: "Vercel", fr: "Vercel" }, description: vercel ? { sl: "Aplikacija teče v okolju Vercel.", fr: "L’application s’exécute sur Vercel." } : { sl: "Projekt Vercel še ni ustvarjen.", fr: "Le projet Vercel n’est pas encore créé." } },
      ]}
      items={[
        { title: "Supabase", meta: { sl: "Podatkovna zbirka, prijava, datoteke in revizijska sled.", fr: "Base de données, connexion, fichiers et journal d’audit." }, status: supabase ? { sl: "Povezano", fr: "Connecté" } : { sl: "Ni povezano", fr: "Non connecté" }, statusTone: supabase ? "ready" : "waiting" },
        { title: "Resend", meta: { sl: "Transakcijska in operativna e-pošta.", fr: "E-mails transactionnels et opérationnels." }, status: resend ? { sl: "Povezano", fr: "Connecté" } : { sl: "Ni povezano", fr: "Non connecté" }, statusTone: resend ? "ready" : "waiting" },
        { title: "Vercel", meta: { sl: "Predogledi, produkcijska objava in domena.", fr: "Aperçus, mise en production et domaine." }, status: vercel ? { sl: "Povezano", fr: "Connecté" } : { sl: "Ni povezano", fr: "Non connecté" }, statusTone: vercel ? "ready" : "waiting" },
      ]}
      metrics={[
        { value: `${connected}/3`, label: { sl: "ključnih povezav", fr: "connexions essentielles" }, detail: { sl: "Supabase, Resend in Vercel", fr: "Supabase, Resend et Vercel" }, tone: "teal" },
        { value: "SL / FR", label: { sl: "jezika administracije", fr: "langues d’administration" }, detail: { sl: "Izbira je shranjena v brskalniku", fr: "Le choix est mémorisé dans le navigateur" }, tone: "navy" },
        { value: "EUR", label: { sl: "valuta trgovine", fr: "devise de la boutique" }, detail: { sl: "DDV je privzeto 22 %", fr: "La TVA est de 22 % par défaut" }, tone: "amber" },
        { value: "EU", label: { sl: "območje zasebnosti", fr: "zone de confidentialité" }, detail: { sl: "Consent Mode v2 pripravljen", fr: "Consent Mode v2 préparé" }, tone: "soft" },
      ]}
      section="settings"
    />
  );
}
