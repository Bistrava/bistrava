import type { Route } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/structured-data";

type BreadcrumbItem = {
  label: string;
  href: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const schemaItems = [
    { name: "Domov", path: "/" },
    ...items.map((item) => ({ name: item.label, path: item.href })),
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(schemaItems)} />
      <nav aria-label="Drobtinice">
        <ol className="breadcrumbs">
          <li>
            <Link href="/">Domov</Link>
          </li>
          {items.map((item, index) => (
            <li key={item.href}>
              <span aria-hidden="true">/</span>{" "}
              {index === items.length - 1 ? (
                <span aria-current="page">{item.label}</span>
              ) : (
                <Link href={item.href as Route}>{item.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
