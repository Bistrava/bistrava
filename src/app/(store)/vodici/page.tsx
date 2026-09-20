import type { Metadata } from "next";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { guides } from "@/lib/content/guides";

export const metadata: Metadata = {
  title: "Vodniki o trdi vodi in mehčalcih",
  description:
    "Strokovni slovenski vodniki o trdi vodi, vodnem kamnu, izbiri mehčalca, montaži, soli in vzdrževanju.",
  alternates: { canonical: "/vodici" },
};

export default function GuidesPage() {
  return (
    <>
      <div className="container"><Breadcrumbs items={[{ label: "Vodniki", href: "/vodici" }]} /></div>
      <section className="info-hero">
        <div className="container">
          <p className="section-kicker">Bistrava znanje</p>
          <h1>Vodniki za mehko vodo brez ugibanja</h1>
          <p>
            Praktične razlage o meritvah, tehnologiji, izbiri, namestitvi in
            vzdrževanju opreme za mehko vodo.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container guide-list guide-list-grid">
          {guides.map((guide) => (
            <Link className="guide-list-card card" href={`/vodici/${guide.slug}`} key={guide.slug}>
              <BookOpen aria-hidden="true" size={30} />
              <span className="eyebrow">Objavljen vodnik</span>
              <h2>{guide.title}</h2>
              <p>{guide.excerpt}</p>
              <span>{guide.readingTime} <ArrowRight aria-hidden="true" size={18} /></span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
