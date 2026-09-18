import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";

type InfoPageProps = {
  kicker: string;
  title: string;
  intro: string;
  path: string;
  children: ReactNode;
  action?: { label: string; href: Route };
};

export function InfoPage({
  kicker,
  title,
  intro,
  path,
  children,
  action,
}: InfoPageProps) {
  return (
    <>
      <div className="container">
        <Breadcrumbs items={[{ label: title, href: path }]} />
      </div>
      <section className="info-hero">
        <div className="narrow-container">
          <p className="section-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </section>
      <section className="section info-content">
        <div className="narrow-container prose-card card">{children}</div>
        {action ? (
          <div className="narrow-container info-action">
            <Link className="button button-primary" href={action.href}>
              {action.label}
            </Link>
          </div>
        ) : null}
      </section>
    </>
  );
}
