import type { Metadata } from "next";

import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { guides } from "@/lib/content/guides";

export const metadata: Metadata = { title: "Vodiči · Administracija" };
export const dynamic = "force-dynamic";

export default function AdminGuidesPage() {
  const drafts = guides.filter((guide) => guide.status === "draft");
  const published = guides.filter((guide) => guide.status === "published");

  return (
    <AdminSectionPage
      checks={[
        { complete: guides.length > 0, title: { sl: "Osnovna knjižnica", fr: "Bibliothèque initiale" }, description: { sl: `${guides.length} strokovnih vodičev je pripravljenih.`, fr: `${guides.length} guides experts sont préparés.` } },
        { complete: published.length > 0, title: { sl: "Uredniška potrditev", fr: "Validation éditoriale" }, description: { sl: `${drafts.length} osnutkov čaka na strokovni pregled.`, fr: `${drafts.length} brouillons attendent une relecture experte.` } },
        { complete: false, title: { sl: "Urejanje v administraciji", fr: "Édition dans l’administration" }, description: { sl: "Naslednji korak je urejevalnik poglavij in objave.", fr: "La prochaine étape est l’éditeur de sections et la publication." } },
      ]}
      items={guides.map((guide) => ({
        title: guide.title,
        meta: { sl: `${guide.readingTime} · posodobljeno ${guide.updatedAt}`, fr: `${guide.readingTime} · mis à jour le ${guide.updatedAt}` },
        status: guide.status === "published" ? { sl: "Objavljeno", fr: "Publié" } : { sl: "Osnutek", fr: "Brouillon" },
        statusTone: guide.status === "published" ? "ready" as const : "waiting" as const,
        href: `/vodici/${guide.slug}`,
      }))}
      metrics={[
        { value: guides.length, label: { sl: "vodičev", fr: "guides" }, detail: { sl: "Osnovna vsebinska zbirka", fr: "Bibliothèque de contenu initiale" }, tone: "teal" },
        { value: drafts.length, label: { sl: "osnutkov", fr: "brouillons" }, detail: { sl: "Čaka na strokovno potrditev", fr: "En attente de validation experte" }, tone: "amber" },
        { value: published.length, label: { sl: "objavljenih", fr: "publiés" }, detail: { sl: "Vidno v javnem središču", fr: "Visibles dans le centre public" }, tone: "navy" },
        { value: guides.reduce((sum, guide) => sum + guide.sections.length, 0), label: { sl: "poglavij", fr: "sections" }, detail: { sl: "Strukturirano za spletno branje", fr: "Structurées pour la lecture en ligne" }, tone: "soft" },
      ]}
      section="guides"
    />
  );
}
