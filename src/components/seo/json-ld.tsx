import type { JsonLdValue } from "@/lib/seo/structured-data";

export function JsonLd({ data }: { data: JsonLdValue }) {
  const safeJson = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}
