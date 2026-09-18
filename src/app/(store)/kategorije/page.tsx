import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { CategoryGrid } from "@/components/store/category-grid";
import { allCategories } from "@/lib/catalog/catalog";

export const metadata: Metadata = {
  title: "Rešitve za obdelavo vode",
  description:
    "Primerjajte kategorije sistemov za mehčanje in filtracijo vode doma.",
  alternates: { canonical: "/kategorije" },
};

export default function CategoriesPage() {
  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: "Rešitve", href: "/kategorije" }]} />
      </div>
      <section className="catalog-hero">
        <div className="container">
          <p className="section-kicker">Kategorije Bistrava</p>
          <h1>Rešitev se začne z dobrim vprašanjem.</h1>
          <p>
            Najprej določite težavo in mesto uporabe. Nato primerjajte zahteve
            za montažo, pretok, vzdrževanje in dolgoročni strošek.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <CategoryGrid categories={allCategories} />
        </div>
      </section>
    </>
  );
}
