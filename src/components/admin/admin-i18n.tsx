"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ProductReadinessCheckId } from "@/lib/admin/catalog-dashboard";

const STORAGE_KEY = "bistrava-admin-language-v1";

const sl = {
  "header.protected": "Varovano skrbniško območje",
  "header.backToStore": "Bistrava – nazaj v trgovino",
  "sidebar.eyebrow": "Upravljanje trgovine",
  "nav.aria": "Skrbniška navigacija",
  "nav.dashboard": "Pregled",
  "nav.products": "Izdelki",
  "nav.orders": "Naročila",
  "nav.inventory": "Zaloga",
  "nav.inquiries": "Povpraševanja",
  "nav.guides": "Vodiči",
  "nav.email": "E-pošta",
  "nav.analytics": "Analitika",
  "nav.soon": "Kmalu",
  "nav.openStore": "Odprite trgovino",
  "nav.settings": "Nastavitve",
  "toolbar.localPreview": "Lokalni predogled",
  "toolbar.noWriting": "Brez zapisovanja podatkov",
  "toolbar.logout": "Odjava",
  "language.switchToFrench": "Preklopite skrbniško okolje v francoščino",
  "language.switchToSlovenian": "Passer l’administration en slovène",
  "language.french": "Français",
  "language.slovenian": "Slovenščina",
  "dashboard.previewTitle": "Lokalni predogled administracije",
  "dashboard.previewDescription": "Prikazujemo ohranjeni katalog. Spremembe in prijava bodo omogočene po povezavi s Supabase.",
  "dashboard.kicker": "Pregled trgovine",
  "dashboard.title": "Nadzorna plošča",
  "dashboard.intro": "Ključni podatki in naslednji koraki za pripravo ponudbe Bistrava.",
  "dashboard.openProducts": "Odprite izdelke",
  "dashboard.summaryAria": "Povzetek kataloga",
  "dashboard.productsPreparing": "izdelkov v pripravi",
  "dashboard.archivedSources": "drugih virov je varno arhiviranih",
  "dashboard.activeProducts": "aktivnih izdelkov",
  "dashboard.activationBlocked": "Aktivacija ostaja blokirana do potrditve",
  "dashboard.withoutSellingPrice": "brez prodajne cene",
  "dashboard.traceableSources": "izdelkov ima sledljiv vir",
  "dashboard.averageReadiness": "povprečna pripravljenost",
  "dashboard.nineChecks": "Na podlagi devetih kontrol na izdelek",
  "dashboard.priorityKicker": "Prednostna naloga",
  "dashboard.priorityTitle": "Izdelki, ki potrebujejo dopolnitev",
  "dashboard.allProducts": "Vsi izdelki",
  "dashboard.infrastructureKicker": "Infrastruktura",
  "dashboard.connectionStatus": "Stanje povezav",
  "dashboard.localCatalog": "Lokalni katalog",
  "dashboard.localDrafts": "24 preverjenih osnutkov",
  "dashboard.ready": "Pripravljeno",
  "dashboard.connected": "Povezano",
  "dashboard.notConnected": "Ni povezano",
  "service.supabase.name": "Supabase",
  "service.supabase.detail": "Podatkovna zbirka in prijava",
  "service.resend.name": "Resend",
  "service.resend.detail": "Samodejna e-pošta",
  "service.vercel.name": "Vercel",
  "service.vercel.detail": "Predogled in objava",
  "products.kicker": "Katalog",
  "products.title": "Izdelki",
  "products.intro": "Preglejte vseh 86 izdelkov iz izvornega kataloga, vključno z arhiviranimi zapisi.",
  "products.publicCatalog": "Javni katalog",
  "products.summaryAria": "Povzetek izdelkov",
  "products.allDrafts": "vseh izdelkov",
  "products.active": "aktivnih",
  "products.sourced": "s potrjenim virom",
  "products.awaitingPrice": "čaka na prodajno ceno",
  "catalog.search": "Iskanje",
  "catalog.searchPlaceholder": "Ime, znamka ali SKU",
  "catalog.category": "Kategorija",
  "catalog.allCategories": "Vse kategorije",
  "catalog.readiness": "Pripravljenost",
  "catalog.allProducts": "Vsi izdelki",
  "catalog.needsWork": "Potrebno je več dela",
  "catalog.wellCompleted": "Dobro dopolnjeni",
  "catalog.of": "od",
  "catalog.products": "izdelkov",
  "catalog.listAria": "Seznam izdelkov",
  "catalog.product": "Izdelek",
  "catalog.commercialData": "Prodajni podatki",
  "catalog.actions": "Dejanja",
  "catalog.bistravaPrice": "Cena Bistrava",
  "catalog.notDefined": "Ni določena",
  "catalog.internalStock": "Interna zaloga",
  "catalog.unverified": "nepreverjeno",
  "catalog.checks": "preverjanj",
  "catalog.missing": "Manjka",
  "catalog.preview": "Predogled",
  "catalog.edit": "Uredi",
  "catalog.editAfterConnection": "Urejanje po povezavi",
  "catalog.editAfterConnectionTitle": "Urejanje bo omogočeno po povezavi s Supabase",
  "catalog.noResults": "Ni zadetkov",
  "catalog.noResultsDescription": "Poskusite z drugim iskalnim izrazom ali filtrom.",
  "status.active": "Aktiven",
  "status.draft": "Osnutek",
  "status.archived": "Arhiviran",
  "category.mehcalci-vode": "Mehčalci vode",
  "category.ciljna-zascita": "Zaščita naprav",
  "category.meritve-in-montaza": "Meritve in montaža",
  "category.sol-in-vzdrzevanje": "Sol in vzdrževanje",
  "readiness.content": "Potrjena vsebina",
  "readiness.gallery": "Galerija s štirimi slikami",
  "readiness.technicalSpecifications": "Tehnične lastnosti",
  "readiness.supplierSource": "Sledljiv dobaviteljski vir",
  "readiness.sellingPrice": "Prodajna cena Bistrava",
  "readiness.publicStock": "Preverjena javna zaloga",
  "readiness.leadTime": "Dobavni rok",
  "readiness.warranty": "Garancija",
  "readiness.technicalDocuments": "Tehnični dokumenti",
} as const;

export type AdminTranslationKey = keyof typeof sl;

const fr: Record<AdminTranslationKey, string> = {
  "header.protected": "Espace d’administration sécurisé",
  "header.backToStore": "Bistrava – retour à la boutique",
  "sidebar.eyebrow": "Gestion de la boutique",
  "nav.aria": "Navigation de l’administration",
  "nav.dashboard": "Tableau de bord",
  "nav.products": "Produits",
  "nav.orders": "Commandes",
  "nav.inventory": "Stock",
  "nav.inquiries": "Demandes",
  "nav.guides": "Guides",
  "nav.email": "E-mails",
  "nav.analytics": "Analyses",
  "nav.soon": "Bientôt",
  "nav.openStore": "Ouvrir la boutique",
  "nav.settings": "Paramètres",
  "toolbar.localPreview": "Aperçu local",
  "toolbar.noWriting": "Données en lecture seule",
  "toolbar.logout": "Déconnexion",
  "language.switchToFrench": "Preklopite skrbniško okolje v francoščino",
  "language.switchToSlovenian": "Passer l’administration en slovène",
  "language.french": "Français",
  "language.slovenian": "Slovenščina",
  "dashboard.previewTitle": "Aperçu local de l’administration",
  "dashboard.previewDescription": "Le catalogue local est affiché en lecture seule. Les modifications et la connexion seront activées après le raccordement à Supabase.",
  "dashboard.kicker": "Vue d’ensemble",
  "dashboard.title": "Tableau de bord",
  "dashboard.intro": "Les données essentielles et les prochaines étapes pour préparer l’offre Bistrava.",
  "dashboard.openProducts": "Ouvrir les produits",
  "dashboard.summaryAria": "Résumé du catalogue",
  "dashboard.productsPreparing": "produits en préparation",
  "dashboard.archivedSources": "autres références archivées en sécurité",
  "dashboard.activeProducts": "produits actifs",
  "dashboard.activationBlocked": "L’activation reste bloquée jusqu’à validation",
  "dashboard.withoutSellingPrice": "sans prix de vente",
  "dashboard.traceableSources": "produits disposent d’une source traçable",
  "dashboard.averageReadiness": "de complétude moyenne",
  "dashboard.nineChecks": "Calculée à partir de neuf contrôles par produit",
  "dashboard.priorityKicker": "Priorité",
  "dashboard.priorityTitle": "Produits à compléter",
  "dashboard.allProducts": "Tous les produits",
  "dashboard.infrastructureKicker": "Infrastructure",
  "dashboard.connectionStatus": "État des connexions",
  "dashboard.localCatalog": "Catalogue local",
  "dashboard.localDrafts": "24 brouillons vérifiés",
  "dashboard.ready": "Prêt",
  "dashboard.connected": "Connecté",
  "dashboard.notConnected": "Non connecté",
  "service.supabase.name": "Supabase",
  "service.supabase.detail": "Base de données et authentification",
  "service.resend.name": "Resend",
  "service.resend.detail": "E-mails automatiques",
  "service.vercel.name": "Vercel",
  "service.vercel.detail": "Prévisualisation et publication",
  "products.kicker": "Catalogue",
  "products.title": "Produits",
  "products.intro": "Consultez les 86 produits du catalogue source, y compris les fiches archivées.",
  "products.publicCatalog": "Catalogue public",
  "products.summaryAria": "Résumé des produits",
  "products.allDrafts": "produits au total",
  "products.active": "actifs",
  "products.sourced": "avec source vérifiée",
  "products.awaitingPrice": "en attente d’un prix de vente",
  "catalog.search": "Rechercher",
  "catalog.searchPlaceholder": "Nom, marque ou SKU",
  "catalog.category": "Catégorie",
  "catalog.allCategories": "Toutes les catégories",
  "catalog.readiness": "Complétude",
  "catalog.allProducts": "Tous les produits",
  "catalog.needsWork": "Davantage de travail requis",
  "catalog.wellCompleted": "Bien renseignés",
  "catalog.of": "sur",
  "catalog.products": "produits",
  "catalog.listAria": "Liste des produits",
  "catalog.product": "Produit",
  "catalog.commercialData": "Données commerciales",
  "catalog.actions": "Actions",
  "catalog.bistravaPrice": "Prix Bistrava",
  "catalog.notDefined": "Non défini",
  "catalog.internalStock": "Stock interne",
  "catalog.unverified": "non vérifié",
  "catalog.checks": "contrôles",
  "catalog.missing": "Manque",
  "catalog.preview": "Prévisualiser",
  "catalog.edit": "Modifier",
  "catalog.editAfterConnection": "Modification après connexion",
  "catalog.editAfterConnectionTitle": "La modification sera activée après la connexion à Supabase",
  "catalog.noResults": "Aucun résultat",
  "catalog.noResultsDescription": "Essayez un autre terme de recherche ou un autre filtre.",
  "status.active": "Actif",
  "status.draft": "Brouillon",
  "status.archived": "Archivé",
  "category.mehcalci-vode": "Adoucisseurs d’eau",
  "category.ciljna-zascita": "Protection des appareils",
  "category.meritve-in-montaza": "Mesure et installation",
  "category.sol-in-vzdrzevanje": "Sel et entretien",
  "readiness.content": "Contenu validé",
  "readiness.gallery": "Galerie de quatre images",
  "readiness.technicalSpecifications": "Caractéristiques techniques",
  "readiness.supplierSource": "Source fournisseur traçable",
  "readiness.sellingPrice": "Prix de vente Bistrava",
  "readiness.publicStock": "Stock public vérifié",
  "readiness.leadTime": "Délai de livraison",
  "readiness.warranty": "Garantie",
  "readiness.technicalDocuments": "Documents techniques",
};

const dictionaries = { sl, fr };
export type AdminLocale = keyof typeof dictionaries;

type AdminLanguageContextValue = {
  locale: AdminLocale;
  t: (key: AdminTranslationKey) => string;
  toggleLanguage: () => void;
};

const AdminLanguageContext = createContext<AdminLanguageContextValue | null>(null);

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AdminLocale>("sl");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const timer =
      saved === "sl" || saved === "fr"
        ? window.setTimeout(() => setLocale(saved), 0)
        : undefined;

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = "sl";
    };
  }, [locale]);

  const toggleLanguage = useCallback(() => {
    setLocale((current) => {
      const next = current === "sl" ? "fr" : "sl";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<AdminLanguageContextValue>(
    () => ({
      locale,
      t: (key) => dictionaries[locale][key],
      toggleLanguage,
    }),
    [locale, toggleLanguage],
  );

  return (
    <AdminLanguageContext.Provider value={value}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage() {
  const context = useContext(AdminLanguageContext);
  if (!context) {
    throw new Error("useAdminLanguage must be used within AdminLanguageProvider");
  }
  return context;
}

const readinessKeys: Record<ProductReadinessCheckId, AdminTranslationKey> = {
  content: "readiness.content",
  gallery: "readiness.gallery",
  technicalSpecifications: "readiness.technicalSpecifications",
  supplierSource: "readiness.supplierSource",
  sellingPrice: "readiness.sellingPrice",
  publicStock: "readiness.publicStock",
  leadTime: "readiness.leadTime",
  warranty: "readiness.warranty",
  technicalDocuments: "readiness.technicalDocuments",
};

export function getReadinessTranslationKey(id: ProductReadinessCheckId) {
  return readinessKeys[id];
}

const categoryKeys: Record<string, AdminTranslationKey> = {
  "mehcalci-vode": "category.mehcalci-vode",
  "ciljna-zascita": "category.ciljna-zascita",
  "meritve-in-montaza": "category.meritve-in-montaza",
  "sol-in-vzdrzevanje": "category.sol-in-vzdrzevanje",
};

export function getCategoryTranslationKey(slug: string) {
  return categoryKeys[slug];
}
