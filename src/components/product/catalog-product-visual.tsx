import {
  Droplets,
  FlaskConical,
  Gauge,
  PackageSearch,
  ShieldCheck,
} from "lucide-react";

const iconByCategory: Record<string, typeof PackageSearch> = {
  "mehcalci-vode": Droplets,
  "meritve-in-montaza": FlaskConical,
  "ciljna-zascita": ShieldCheck,
  "sol-in-vzdrzevanje": Gauge,
};

type CatalogProductVisualProps = {
  categorySlug: string;
  productName: string;
  compact?: boolean;
};

export function CatalogProductVisual({
  categorySlug,
  productName,
  compact = false,
}: CatalogProductVisualProps) {
  const Icon = iconByCategory[categorySlug] ?? PackageSearch;

  return (
    <div
      className={`catalog-product-visual${compact ? " catalog-product-visual-compact" : ""}`}
      role="img"
      aria-label={`Začasna kataloška vizualizacija za ${productName}`}
    >
      <span>Kataloška vizualizacija</span>
      <div aria-hidden="true">
        <Icon size={compact ? 46 : 72} strokeWidth={1.55} />
        <i />
        <i />
        <i />
      </div>
      <small>Fotografija izdelka še ni potrjena</small>
    </div>
  );
}
