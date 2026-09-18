import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getGuide, guides } from "@/lib/content/guides";
import { articleSchema } from "@/lib/seo/structured-data";

type GuidePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.excerpt,
    alternates: { canonical: `/vodici/${slug}` },
    robots: guide.status === "draft" ? { index: false, follow: true } : undefined,
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <>
      <JsonLd data={articleSchema(guide)} />
      <div className="container">
        <Breadcrumbs items={[{ label: "Vodniki", href: "/vodici" }, { label: guide.title, href: `/vodici/${slug}` }]} />
      </div>
      <article className="guide-article">
        <header className="narrow-container">
          <span className="eyebrow">Osnutek - strokovni pregled še sledi</span>
          <h1>{guide.title}</h1>
          <p>{guide.excerpt}</p>
          <small>{guide.readingTime} · Posodobljeno {guide.updatedAt}</small>
        </header>
        <div className="narrow-container article-body card">
          {guide.sections.map((section, index) => (
            <section key={section.title}>
              <h2>{index + 1}. {section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <div className="article-checklist">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <h2>Naslednji korak</h2>
              <p>Za izbiro pripravite meritev trdote, podatke o porabi in fotografije mesta montaže.</p>
              <Link className="button button-primary" href="/izbira-mehcalca">Odprite konfigurator</Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
