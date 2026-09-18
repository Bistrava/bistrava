"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  Boxes,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Mail,
  Settings,
  UsersRound,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { useAdminLanguage } from "@/components/admin/admin-i18n";
import type { AdminSectionId } from "@/components/admin/admin-workspace";

type Localized = { sl: string; fr: string };
type OperationalSectionId = Exclude<AdminSectionId, "dashboard" | "products">;

export type AdminSectionMetric = {
  value: string | number;
  label: Localized;
  detail: Localized;
  tone?: "teal" | "navy" | "amber" | "soft";
};

export type AdminSectionItem = {
  title: string;
  meta: Localized;
  status: Localized;
  statusTone?: "ready" | "waiting" | "neutral";
  href?: string;
};

export type AdminSectionCheck = {
  title: Localized;
  description: Localized;
  complete: boolean;
};

const presentation = {
  orders: {
    icon: ClipboardList,
    kicker: { sl: "Prodaja", fr: "Vente" },
    title: { sl: "Naročila", fr: "Commandes" },
    intro: {
      sl: "Spremljajte naročila od prejema do plačila, priprave in dostave.",
      fr: "Suivez les commandes depuis leur réception jusqu’au paiement, à la préparation et à la livraison.",
    },
  },
  inventory: {
    icon: Boxes,
    kicker: { sl: "Operativa", fr: "Opérations" },
    title: { sl: "Zaloga", fr: "Stock" },
    intro: {
      sl: "Ločite interno količino od preverjene javne razpoložljivosti vsakega izdelka.",
      fr: "Distinguez la quantité interne de la disponibilité publique vérifiée de chaque produit.",
    },
  },
  inquiries: {
    icon: UsersRound,
    kicker: { sl: "Prodajni stiki", fr: "Contacts commerciaux" },
    title: { sl: "Povpraševanja", fr: "Demandes" },
    intro: {
      sl: "Centralizirajte zahteve za ponudbo, svetovanje in montažo.",
      fr: "Centralisez les demandes de devis, de conseil et d’installation.",
    },
  },
  guides: {
    icon: BookOpenText,
    kicker: { sl: "Vsebina", fr: "Contenu" },
    title: { sl: "Vodiči", fr: "Guides" },
    intro: {
      sl: "Preglejte strokovne vsebine pred uredniško potrditvijo in objavo.",
      fr: "Contrôlez les contenus experts avant leur validation éditoriale et leur publication.",
    },
  },
  email: {
    icon: Mail,
    kicker: { sl: "Avtomatizacija", fr: "Automatisation" },
    title: { sl: "E-pošta", fr: "E-mails" },
    intro: {
      sl: "Pripravite samodejna sporočila za naročila in povpraševanja prek Resend.",
      fr: "Préparez les messages automatiques liés aux commandes et aux demandes avec Resend.",
    },
  },
  analytics: {
    icon: BarChart3,
    kicker: { sl: "Merjenje", fr: "Mesure" },
    title: { sl: "Analitika", fr: "Analyses" },
    intro: {
      sl: "Spremljajte pripravo merjenja, zasebnost in ključne prodajne dogodke.",
      fr: "Suivez la préparation de la mesure, la confidentialité et les événements commerciaux essentiels.",
    },
  },
  settings: {
    icon: Settings,
    kicker: { sl: "Konfiguracija", fr: "Configuration" },
    title: { sl: "Nastavitve", fr: "Paramètres" },
    intro: {
      sl: "Na enem mestu preverite povezave, okolje in pripravljenost trgovine.",
      fr: "Vérifiez au même endroit les connexions, l’environnement et l’état de préparation de la boutique.",
    },
  },
} as const satisfies Record<OperationalSectionId, {
  icon: typeof ClipboardList;
  kicker: Localized;
  title: Localized;
  intro: Localized;
}>;

const shared = {
  sl: {
    preview: "Lokalni podatki za pripravo",
    previewDescription: "Ta razdelek že deluje kot operativni pregled. Živi zapisi bodo prikazani po povezavi s Supabase.",
    overview: "Pregled",
    worklist: "Delovni seznam",
    readiness: "Pripravljenost modula",
    noItems: "Trenutno ni zapisov v tem seznamu.",
  },
  fr: {
    preview: "Données locales de préparation",
    previewDescription: "Cette rubrique fonctionne déjà comme vue opérationnelle. Les données réelles apparaîtront après la connexion à Supabase.",
    overview: "Vue d’ensemble",
    worklist: "Liste de travail",
    readiness: "Préparation du module",
    noItems: "Aucune donnée ne figure encore dans cette liste.",
  },
} as const;

export function AdminSectionView({
  section,
  isPreview,
  metrics,
  items,
  checks,
}: {
  section: OperationalSectionId;
  isPreview: boolean;
  metrics: AdminSectionMetric[];
  items: AdminSectionItem[];
  checks: AdminSectionCheck[];
}) {
  const { locale } = useAdminLanguage();
  const sectionCopy = presentation[section];
  const labels = shared[locale];
  const Icon = sectionCopy.icon;

  return (
    <>
      {isPreview ? (
        <div className="admin-preview-banner" role="status">
          <CircleAlert aria-hidden="true" size={19} />
          <div>
            <strong>{labels.preview}</strong>
            <span>{labels.previewDescription}</span>
          </div>
        </div>
      ) : null}

      <header className="admin-page-heading admin-section-heading">
        <div>
          <p className="section-kicker">{sectionCopy.kicker[locale]}</p>
          <h1>{sectionCopy.title[locale]}</h1>
          <p>{sectionCopy.intro[locale]}</p>
        </div>
        <span className="admin-section-hero-icon"><Icon aria-hidden="true" size={28} /></span>
      </header>

      <section aria-label={labels.overview} className="admin-stat-grid admin-section-metrics">
        {metrics.map((metric, index) => (
          <article className="admin-stat-card card" key={`${metric.label.sl}-${index}`}>
            <span className={`admin-stat-icon is-${metric.tone ?? "teal"}`}>
              <Icon aria-hidden="true" size={22} />
            </span>
            <div><strong>{metric.value}</strong><span>{metric.label[locale]}</span></div>
            <small>{metric.detail[locale]}</small>
          </article>
        ))}
      </section>

      <div className="admin-section-layout">
        <section className="admin-dashboard-panel card">
          <div className="admin-panel-heading">
            <div><p className="section-kicker">{sectionCopy.kicker[locale]}</p><h2>{labels.worklist}</h2></div>
          </div>
          <div className="admin-operational-list">
            {items.length ? items.map((item, index) => {
              const content = (
                <>
                  <div><strong>{item.title}</strong><span>{item.meta[locale]}</span></div>
                  <span className={`admin-operational-status is-${item.statusTone ?? "neutral"}`}>{item.status[locale]}</span>
                  {item.href ? <ArrowRight aria-hidden="true" size={16} /> : null}
                </>
              );
              return item.href ? (
                <Link href={item.href as Route} key={`${item.title}-${index}`}>{content}</Link>
              ) : (
                <div key={`${item.title}-${index}`}>{content}</div>
              );
            }) : <p className="admin-operational-empty">{labels.noItems}</p>}
          </div>
        </section>

        <section className="admin-dashboard-panel card">
          <div className="admin-panel-heading">
            <div><p className="section-kicker">Bistrava</p><h2>{labels.readiness}</h2></div>
          </div>
          <ul className="admin-module-checklist">
            {checks.map((check) => (
              <li className={check.complete ? "is-complete" : undefined} key={check.title.sl}>
                {check.complete ? <CheckCircle2 aria-hidden="true" size={19} /> : <CircleAlert aria-hidden="true" size={19} />}
                <div><strong>{check.title[locale]}</strong><span>{check.description[locale]}</span></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
