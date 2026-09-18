import { notFound, permanentRedirect } from "next/navigation";

import { getCatalogProduct, specialistProducts } from "@/lib/catalog/catalog";

type LegacyProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return specialistProducts.map((product) => ({ slug: product.slug }));
}

export default async function LegacyProductPage({ params }: LegacyProductPageProps) {
  const { slug } = await params;
  const product = getCatalogProduct(slug);

  if (!product || product.status === "archived") notFound();
  permanentRedirect(`/izdelki/${product.slug}`);
}
