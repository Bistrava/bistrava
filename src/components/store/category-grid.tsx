import {
  ArrowUpRight,
  Droplets,
  Filter,
  Gauge,
  House,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import type { Category } from "@/types/catalog";

const categoryIcons = {
  droplets: Droplets,
  filter: Filter,
  gauge: Gauge,
  home: House,
  shield: ShieldCheck,
  refresh: RefreshCw,
} as const;

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="category-grid">
      {categories.map((category, index) => {
        const Icon = categoryIcons[category.icon];

        return (
          <Link
            className="category-card card"
            href={`/kategorije/${category.slug}`}
            key={category.slug}
          >
            <span className="category-card-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="category-icon">
              <Icon aria-hidden="true" size={28} strokeWidth={1.8} />
            </span>
            <span className="category-problem">{category.problem}</span>
            <strong>{category.shortName}</strong>
            <span className="category-description">{category.description}</span>
            <span className="category-link">
              Raziščite rešitev <ArrowUpRight aria-hidden="true" size={17} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
