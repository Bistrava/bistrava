import type { Metadata } from "next";

import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { getAdminCatalogProducts } from "@/lib/admin/catalog-dashboard";

export const metadata: Metadata = { title: "Zaloga · Administracija" };
export const dynamic = "force-dynamic";

export default function AdminInventoryPage() {
  const products = getAdminCatalogProducts();
  const totalUnits = products.reduce((sum, product) => sum + product.stockQuantity, 0);
  const verified = products.filter((product) => product.stockStatus !== "unverified").length;

  return (
    <AdminSectionPage
      checks={[
        { complete: true, title: { sl: "Interni začetni popis", fr: "Inventaire interne initial" }, description: { sl: `${products.length} izdelkov ima delovno količino.`, fr: `${products.length} produits disposent d’une quantité de travail.` } },
        { complete: verified === products.length, title: { sl: "Javna razpoložljivost", fr: "Disponibilité publique" }, description: { sl: `${products.length - verified} statusov mora potrditi skrbnik.`, fr: `${products.length - verified} statuts doivent être confirmés par l’administrateur.` } },
        { complete: false, title: { sl: "Premiki zaloge", fr: "Mouvements de stock" }, description: { sl: "Samodejni dnevnik se vključi s Supabase.", fr: "Le journal automatique sera activé avec Supabase." } },
      ]}
      items={products.slice(0, 8).map((product) => ({
        title: product.name,
        meta: { sl: `${product.sku} · interna količina ${product.stockQuantity}`, fr: `${product.sku} · quantité interne ${product.stockQuantity}` },
        status: product.stockStatus === "unverified" ? { sl: "Nepreverjeno", fr: "Non vérifié" } : { sl: "Potrjeno", fr: "Confirmé" },
        statusTone: product.stockStatus === "unverified" ? "waiting" as const : "ready" as const,
        href: `/admin/izdelki/${product.slug}`,
      }))}
      metrics={[
        { value: products.length, label: { sl: "izdelkov v popisu", fr: "produits inventoriés" }, detail: { sl: "Celoten specializirani katalog", fr: "Catalogue spécialisé complet" }, tone: "teal" },
        { value: totalUnits, label: { sl: "internih enot", fr: "unités internes" }, detail: { sl: "Delovna količina, ne javna obljuba", fr: "Quantité de travail, non promesse publique" }, tone: "navy" },
        { value: products.length - verified, label: { sl: "nepreverjenih statusov", fr: "statuts non vérifiés" }, detail: { sl: "Potrdite pred aktivacijo", fr: "À confirmer avant activation" }, tone: "amber" },
        { value: verified, label: { sl: "potrjenih statusov", fr: "statuts confirmés" }, detail: { sl: "Pripravljeno za javni prikaz", fr: "Prêts pour l’affichage public" }, tone: "soft" },
      ]}
      section="inventory"
    />
  );
}
