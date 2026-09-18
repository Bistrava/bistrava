import type { Metadata } from "next";
import { Search } from "lucide-react";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export const metadata: Metadata = {
  title: "Iskanje",
  robots: { index: false, follow: false },
};

export default function SearchPage() {
  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: "Iskanje", href: "/iskanje" }]} />
      </div>
      <section className="section utility-page">
        <div className="narrow-container">
          <p className="section-kicker">Iskanje kataloga</p>
          <h1>Kaj iščete?</h1>
          <form className="search-form" role="search">
            <label className="sr-only" htmlFor="site-search">
              Iskalni niz
            </label>
            <Search aria-hidden="true" />
            <input
              id="site-search"
              name="q"
              placeholder="Izdelek, težava ali vodič …"
              disabled
            />
            <button className="button button-primary" type="button" disabled>
              Išči
            </button>
          </form>
          <p className="notice">
            Iskalni indeks bo povezan po objavi preverjenega kataloga.
          </p>
        </div>
      </section>
    </>
  );
}
