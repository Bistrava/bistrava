import { notFound, permanentRedirect } from "next/navigation";

import { catalogProducts, getCatalogProduct } from "@/lib/catalog/catalog";

type LegacyProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return catalogProducts.map((product) => ({ slug: product.slug }));
}

export default async function LegacyProductPage({ params }: LegacyProductPageProps) {
  const { slug } = await params;
  const product = getCatalogProduct(slug);

  if (!product) notFound();
  permanentRedirect(`/izdelki/${product.slug}`);
}
