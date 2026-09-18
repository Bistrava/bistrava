"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  Check,
  CircleAlert,
  FileText,
  ImageIcon,
  PackageCheck,
  RotateCcw,
  Save,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  initialAdminProductActionState,
  saveAdminProduct,
} from "@/actions/admin-products";
import { useAdminLanguage } from "@/components/admin/admin-i18n";
import type {
  AdminProductEditorData,
  AdminProductEditorValues,
} from "@/lib/admin/product-editor";
import { formatMoney } from "@/lib/commerce/money";
import { adminProductFormSchema } from "@/lib/validation/admin-product";

type EditorTab = "content" | "seo" | "commerce" | "stock" | "technical";
type AccessMode = "preview" | "authenticated";
type LocalNotice = "savedDraft" | "restoredDraft" | "resetDone" | "invalid";

const copy = {
  sl: {
    back: "Nazaj na izdelke",
    kicker: "Urejanje izdelka",
    preview: "Javni predogled",
    savedDraft: "Lokalni osnutek je shranjen v tem brskalniku.",
    restoredDraft: "Obnovili smo lokalni osnutek za ta izdelek.",
    resetDone: "Lokalne spremembe so bile odstranjene.",
    invalid: "Pred shranjevanjem preverite označena polja.",
    previewNote: "V lokalnem predogledu se spremembe shranijo samo v ta brskalnik. Po povezavi s Supabase se bo isti obrazec zapisoval v podatkovno zbirko.",
    liveNote: "Spremembe se varno zapišejo v Supabase in zabeležijo v dnevnik dejanj.",
    dirty: "Neshranjene spremembe",
    saved: "Shranjeno",
    reset: "Ponastavi",
    save: "Shrani izdelek",
    saving: "Shranjevanje …",
    content: "Vsebina",
    seo: "SEO",
    commerce: "Prodaja",
    stock: "Zaloga",
    technical: "Tehnični podatki",
    basics: "Osnovni podatki",
    basicsHint: "Javno ime, URL, znamka in način prodaje.",
    name: "Ime izdelka",
    slug: "URL oznaka",
    brand: "Znamka",
    sku: "SKU",
    technology: "Tehnologija",
    status: "Status",
    salesMode: "Način prodaje",
    featured: "Izpostavljen izdelek",
    no: "Ne",
    yes: "Da",
    draft: "Osnutek",
    active: "Aktiven",
    archived: "Arhiviran",
    buyNow: "Neposredni nakup",
    quote: "Povpraševanje",
    installation: "Potrebna montaža",
    descriptions: "Opisi",
    descriptionsHint: "Besedilo, ki kupcu razloži namen, uporabo in omejitve.",
    shortDescription: "Kratek opis",
    longDescription: "Celoten opis",
    highlights: "Glavne prednosti",
    lineHint: "En vnos na vrstico",
    seoHeading: "Iskalniki in odkrivanje",
    seoHint: "Uredite naslov, meta opis, ključne besede in notranje oznake.",
    seoTitle: "SEO naslov",
    seoDescription: "Meta opis",
    primaryKeyword: "Glavna ključna beseda",
    secondaryKeywords: "Dodatne ključne besede",
    longTailKeywords: "Dolge iskalne poizvedbe",
    tags: "Oznake",
    commaHint: "Ločite z vejico ali novo vrstico",
    pricing: "Cene in davki",
    pricingHint: "Javna prodajna cena se uporablja šele po aktivaciji izdelka.",
    price: "Prodajna cena z DDV",
    comparePrice: "Primerjalna cena",
    vat: "DDV",
    supplierReference: "Referenčna dobaviteljska cena",
    source: "Vir",
    stockHeading: "Razpoložljivost",
    stockHint: "Interna količina ni javna obljuba zaloge; javni status potrdite posebej.",
    stockStatus: "Javni status zaloge",
    quantity: "Interna količina",
    leadTime: "Dobavni rok (dni)",
    warranty: "Garancija (mesecev)",
    inStock: "Na zalogi",
    outOfStock: "Ni na zalogi",
    backorder: "Po naročilu",
    unverified: "Nepreverjeno",
    activation: "Pogoji za aktivacijo",
    activationHint: "Za objavo so obvezni cena, preverjena zaloga, dobavni rok, garancija, tehnični podatki in slika.",
    image: "Slika",
    specs: "Tehnični podatki",
    household: "Velikost gospodinjstva",
    householdMin: "Najmanj oseb",
    householdMax: "Največ oseb",
    resin: "Količina smole (l)",
    nominalFlow: "Nazivni pretok (l/min)",
    maxFlow: "Največji pretok (l/min)",
    connection: "Velikost priključka",
    regeneration: "Način regeneracije",
    salt: "Poraba soli (kg)",
    dimensions: "Mere",
    weight: "Teža (kg)",
    drain: "Potreben odtok",
    electricity: "Potrebna elektrika",
    bypass: "Obvod vključen",
    unknown: "Ni določeno",
    technicalList: "Tabela lastnosti",
    technicalListHint: "Vsaka vrstica: oznaka | vrednost",
    certifications: "Certifikati",
    media: "Mediji in dokumenti",
    images: "slik",
    documents: "dokumentov",
    mediaHint: "Upravljanje datotek bo povezano s Supabase Storage; trenutne datoteke so prikazane kot referenca.",
  },
  fr: {
    back: "Retour aux produits",
    kicker: "Modification du produit",
    preview: "Aperçu public",
    savedDraft: "Le brouillon local est enregistré dans ce navigateur.",
    restoredDraft: "Le brouillon local de ce produit a été restauré.",
    resetDone: "Les modifications locales ont été supprimées.",
    invalid: "Vérifiez les champs signalés avant d’enregistrer.",
    previewNote: "Dans l’aperçu local, les changements sont enregistrés uniquement dans ce navigateur. Une fois Supabase connecté, ce même formulaire écrira dans la base de données.",
    liveNote: "Les changements sont enregistrés dans Supabase et consignés dans le journal d’audit.",
    dirty: "Modifications non enregistrées",
    saved: "Enregistré",
    reset: "Réinitialiser",
    save: "Enregistrer le produit",
    saving: "Enregistrement…",
    content: "Contenu",
    seo: "SEO",
    commerce: "Vente",
    stock: "Stock",
    technical: "Données techniques",
    basics: "Informations principales",
    basicsHint: "Nom public, URL, marque et mode de vente.",
    name: "Nom du produit",
    slug: "Identifiant URL",
    brand: "Marque",
    sku: "SKU",
    technology: "Technologie",
    status: "Statut",
    salesMode: "Mode de vente",
    featured: "Produit mis en avant",
    no: "Non",
    yes: "Oui",
    draft: "Brouillon",
    active: "Actif",
    archived: "Archivé",
    buyNow: "Achat direct",
    quote: "Demande de devis",
    installation: "Installation requise",
    descriptions: "Descriptions",
    descriptionsHint: "Le contenu qui explique au client l’usage, les avantages et les limites.",
    shortDescription: "Description courte",
    longDescription: "Description complète",
    highlights: "Avantages principaux",
    lineHint: "Une entrée par ligne",
    seoHeading: "Référencement et découverte",
    seoHint: "Modifiez le titre, la méta-description, les mots-clés et les étiquettes internes.",
    seoTitle: "Titre SEO",
    seoDescription: "Méta-description",
    primaryKeyword: "Mot-clé principal",
    secondaryKeywords: "Mots-clés secondaires",
    longTailKeywords: "Requêtes de longue traîne",
    tags: "Étiquettes",
    commaHint: "Séparez par une virgule ou un saut de ligne",
    pricing: "Prix et taxes",
    pricingHint: "Le prix public ne sera utilisé qu’après l’activation du produit.",
    price: "Prix de vente TTC",
    comparePrice: "Prix de comparaison",
    vat: "TVA",
    supplierReference: "Prix fournisseur de référence",
    source: "Source",
    stockHeading: "Disponibilité",
    stockHint: "La quantité interne n’est pas une promesse publique de stock ; le statut public doit être confirmé séparément.",
    stockStatus: "Statut public du stock",
    quantity: "Quantité interne",
    leadTime: "Délai de livraison (jours)",
    warranty: "Garantie (mois)",
    inStock: "En stock",
    outOfStock: "Rupture de stock",
    backorder: "Sur commande",
    unverified: "Non vérifié",
    activation: "Conditions d’activation",
    activationHint: "La publication exige un prix, un stock vérifié, un délai, une garantie, des caractéristiques et une image.",
    image: "Image",
    specs: "Caractéristiques",
    household: "Taille du foyer",
    householdMin: "Nombre minimum de personnes",
    householdMax: "Nombre maximum de personnes",
    resin: "Volume de résine (l)",
    nominalFlow: "Débit nominal (l/min)",
    maxFlow: "Débit maximal (l/min)",
    connection: "Taille du raccord",
    regeneration: "Mode de régénération",
    salt: "Consommation de sel (kg)",
    dimensions: "Dimensions",
    weight: "Poids (kg)",
    drain: "Évacuation requise",
    electricity: "Électricité requise",
    bypass: "Bypass inclus",
    unknown: "Non défini",
    technicalList: "Tableau des caractéristiques",
    technicalListHint: "Chaque ligne : libellé | valeur",
    certifications: "Certifications",
    media: "Médias et documents",
    images: "images",
    documents: "documents",
    mediaHint: "La gestion des fichiers sera reliée à Supabase Storage ; les fichiers actuels sont affichés comme référence.",
  },
} as const;

function Field({
  label,
  hint,
  error,
  children,
  wide = false,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "admin-editor-field is-wide" : "admin-editor-field"}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
      {error ? <em role="alert">{error}</em> : null}
    </label>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-editor-section card">
      <header>
        <span className="admin-editor-section-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className="admin-editor-grid">{children}</div>
    </section>
  );
}

export function AdminProductEditor({
  product,
  accessMode,
}: {
  product: AdminProductEditorData;
  accessMode: AccessMode;
}) {
  const { locale } = useAdminLanguage();
  const labels = copy[locale];
  const router = useRouter();
  const [tab, setTab] = useState<EditorTab>("content");
  const [values, setValues] = useState(product.values);
  const [dirty, setDirty] = useState(false);
  const [localNotice, setLocalNotice] = useState<LocalNotice | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string[]>>({});
  const [actionState, formAction, isPending] = useActionState(
    saveAdminProduct,
    initialAdminProductActionState,
  );
  const storageKey = `bistrava-admin-product-draft-v1:${product.values.currentSlug}`;

  useEffect(() => {
    if (accessMode !== "preview") return;
    const rawDraft = window.localStorage.getItem(storageKey);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft) as Record<string, unknown>;
      const restored = { ...product.values };
      for (const key of Object.keys(restored) as Array<keyof AdminProductEditorValues>) {
        if (typeof draft[key] === "string") {
          restored[key] = draft[key] as never;
        }
      }
      const timer = window.setTimeout(() => {
        setValues(restored);
        setDirty(false);
        setLocalNotice("restoredDraft");
      }, 0);
      return () => window.clearTimeout(timer);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [accessMode, product.values, storageKey]);

  useEffect(() => {
    if (actionState.status !== "success") return;
    const timer = window.setTimeout(() => setDirty(false), 0);
    if (actionState.redirectUrl) router.replace(actionState.redirectUrl);
    return () => window.clearTimeout(timer);
  }, [actionState, router]);

  const errors = actionState.status === "error" && accessMode === "authenticated"
    ? actionState.fieldErrors ?? {}
    : localErrors;

  const activationChecks = useMemo(
    () => [
      { label: labels.price, complete: values.priceEuros.trim() !== "" },
      { label: labels.stockStatus, complete: values.stockStatus !== "unverified" },
      { label: labels.leadTime, complete: values.leadTimeDays.trim() !== "" },
      { label: labels.warranty, complete: values.warrantyMonths.trim() !== "" },
      { label: labels.specs, complete: values.technicalSpecifications.trim() !== "" },
      { label: labels.image, complete: product.imageCount > 0 },
    ],
    [labels, product.imageCount, values],
  );

  function update<K extends keyof AdminProductEditorValues>(
    key: K,
    value: AdminProductEditorValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setLocalNotice(null);
    setLocalErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function saveLocal(event: FormEvent<HTMLFormElement>) {
    if (accessMode !== "preview") return;
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const result = adminProductFormSchema.safeParse(raw);
    if (!result.success) {
      setLocalErrors(result.error.flatten().fieldErrors);
      setLocalNotice("invalid");
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(values));
    setLocalErrors({});
    setDirty(false);
    setLocalNotice("savedDraft");
  }

  function resetLocal() {
    if (accessMode === "preview") window.localStorage.removeItem(storageKey);
    setValues(product.values);
    setLocalErrors({});
    setDirty(false);
    setLocalNotice("resetDone");
  }

  const statusMessage = accessMode === "authenticated"
    ? actionState.message
    : localNotice
      ? labels[localNotice]
      : "";
  const isError = accessMode === "authenticated"
    ? actionState.status === "error"
    : Object.keys(localErrors).length > 0;

  const tabs: Array<{ id: EditorTab; label: string; icon: ReactNode }> = [
    { id: "content", label: labels.content, icon: <FileText size={17} /> },
    { id: "seo", label: labels.seo, icon: <Search size={17} /> },
    { id: "commerce", label: labels.commerce, icon: <ShoppingBag size={17} /> },
    { id: "stock", label: labels.stock, icon: <Boxes size={17} /> },
    { id: "technical", label: labels.technical, icon: <Settings2 size={17} /> },
  ];

  return (
    <form
      action={accessMode === "authenticated" ? formAction : undefined}
      className="admin-product-editor"
      onSubmit={saveLocal}
    >
      <input name="adminLocale" type="hidden" value={locale} />
      <input name="currentSlug" type="hidden" value={values.currentSlug} />

      <div className="admin-editor-heading">
        <div>
          <Link className="admin-editor-back" href="/admin/izdelki">
            <ArrowLeft aria-hidden="true" size={17} />
            {labels.back}
          </Link>
          <p className="section-kicker">{labels.kicker}</p>
          <h1>{values.nameSl}</h1>
          <div className="admin-editor-meta">
            <span>{values.sku}</span>
            <span>{product.categoryName}</span>
            <span className={`admin-status admin-status-${values.status}`}>
              {labels[values.status]}
            </span>
          </div>
        </div>
        {product.values.status !== "archived" ? (
          <div className="admin-editor-heading-actions">
            <Link
              className="button button-secondary"
              href={`/izdelki/${values.currentSlug}`}
              target="_blank"
            >
              {labels.preview}
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
        ) : null}
      </div>

      <div className="admin-editor-mode-note">
        <CircleAlert aria-hidden="true" size={19} />
        <p>{accessMode === "preview" ? labels.previewNote : labels.liveNote}</p>
      </div>

      <div aria-label={labels.content} className="admin-editor-tabs" role="tablist">
        {tabs.map((item) => (
          <button
            aria-selected={tab === item.id}
            className={tab === item.id ? "is-active" : undefined}
            key={item.id}
            onClick={() => setTab(item.id)}
            role="tab"
            type="button"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="admin-editor-tab-panel" hidden={tab !== "content"} role="tabpanel">
          <Section
            description={labels.basicsHint}
            icon={<PackageCheck size={21} />}
            title={labels.basics}
          >
            <Field error={errors.nameSl?.[0]} label={labels.name} wide>
              <input name="nameSl" onChange={(event) => update("nameSl", event.target.value)} value={values.nameSl} />
            </Field>
            <Field error={errors.slug?.[0]} label={labels.slug}>
              <input name="slug" onChange={(event) => update("slug", event.target.value)} value={values.slug} />
            </Field>
            <Field error={errors.brand?.[0]} label={labels.brand}>
              <input name="brand" onChange={(event) => update("brand", event.target.value)} value={values.brand} />
            </Field>
            <Field error={errors.sku?.[0]} label={labels.sku}>
              <input name="sku" onChange={(event) => update("sku", event.target.value)} value={values.sku} />
            </Field>
            <Field error={errors.technology?.[0]} label={labels.technology} wide>
              <input name="technology" onChange={(event) => update("technology", event.target.value)} value={values.technology} />
            </Field>
            <Field label={labels.status}>
              <select name="status" onChange={(event) => update("status", event.target.value as AdminProductEditorValues["status"])} value={values.status}>
                <option value="draft">{labels.draft}</option>
                <option value="active">{labels.active}</option>
                <option value="archived">{labels.archived}</option>
              </select>
            </Field>
            <Field label={labels.salesMode}>
              <select name="salesMode" onChange={(event) => update("salesMode", event.target.value as AdminProductEditorValues["salesMode"])} value={values.salesMode}>
                <option value="buy_now">{labels.buyNow}</option>
                <option value="quote">{labels.quote}</option>
                <option value="installation_required">{labels.installation}</option>
              </select>
            </Field>
            <Field label={labels.featured}>
              <select name="featured" onChange={(event) => update("featured", event.target.value as "true" | "false")} value={values.featured}>
                <option value="false">{labels.no}</option>
                <option value="true">{labels.yes}</option>
              </select>
            </Field>
          </Section>
          <Section
            description={labels.descriptionsHint}
            icon={<FileText size={21} />}
            title={labels.descriptions}
          >
            <Field error={errors.shortDescriptionSl?.[0]} label={labels.shortDescription} wide>
              <textarea name="shortDescriptionSl" onChange={(event) => update("shortDescriptionSl", event.target.value)} rows={3} value={values.shortDescriptionSl} />
            </Field>
            <Field error={errors.descriptionSl?.[0]} label={labels.longDescription} wide>
              <textarea name="descriptionSl" onChange={(event) => update("descriptionSl", event.target.value)} rows={8} value={values.descriptionSl} />
            </Field>
            <Field error={errors.highlights?.[0]} hint={labels.lineHint} label={labels.highlights} wide>
              <textarea name="highlights" onChange={(event) => update("highlights", event.target.value)} rows={5} value={values.highlights} />
            </Field>
          </Section>
      </div>

      <div className="admin-editor-tab-panel" hidden={tab !== "seo"} role="tabpanel">
        <Section description={labels.seoHint} icon={<Search size={21} />} title={labels.seoHeading}>
          <Field error={errors.seoTitle?.[0]} label={labels.seoTitle} wide>
            <input maxLength={70} name="seoTitle" onChange={(event) => update("seoTitle", event.target.value)} value={values.seoTitle} />
          </Field>
          <Field error={errors.seoDescriptionSl?.[0]} label={labels.seoDescription} wide>
            <textarea maxLength={180} name="seoDescriptionSl" onChange={(event) => update("seoDescriptionSl", event.target.value)} rows={4} value={values.seoDescriptionSl} />
          </Field>
          <Field error={errors.primaryKeyword?.[0]} label={labels.primaryKeyword} wide>
            <input name="primaryKeyword" onChange={(event) => update("primaryKeyword", event.target.value)} value={values.primaryKeyword} />
          </Field>
          <Field error={errors.secondaryKeywords?.[0]} hint={labels.commaHint} label={labels.secondaryKeywords} wide>
            <textarea name="secondaryKeywords" onChange={(event) => update("secondaryKeywords", event.target.value)} rows={3} value={values.secondaryKeywords} />
          </Field>
          <Field error={errors.longTailKeywords?.[0]} hint={labels.commaHint} label={labels.longTailKeywords} wide>
            <textarea name="longTailKeywords" onChange={(event) => update("longTailKeywords", event.target.value)} rows={3} value={values.longTailKeywords} />
          </Field>
          <Field error={errors.tags?.[0]} hint={labels.commaHint} label={labels.tags} wide>
            <textarea name="tags" onChange={(event) => update("tags", event.target.value)} rows={3} value={values.tags} />
          </Field>
        </Section>
      </div>

      <div className="admin-editor-tab-panel" hidden={tab !== "commerce"} role="tabpanel">
        <Section description={labels.pricingHint} icon={<ShoppingBag size={21} />} title={labels.pricing}>
          <Field error={errors.priceEuros?.[0]} label={`${labels.price} (€)`}>
            <input inputMode="decimal" name="priceEuros" onChange={(event) => update("priceEuros", event.target.value)} placeholder="0,00" value={values.priceEuros} />
          </Field>
          <Field error={errors.compareAtPriceEuros?.[0]} label={`${labels.comparePrice} (€)`}>
            <input inputMode="decimal" name="compareAtPriceEuros" onChange={(event) => update("compareAtPriceEuros", event.target.value)} placeholder="0,00" value={values.compareAtPriceEuros} />
          </Field>
          <Field error={errors.vatRate?.[0]} label={`${labels.vat} (%)`}>
            <input inputMode="decimal" name="vatRate" onChange={(event) => update("vatRate", event.target.value)} value={values.vatRate} />
          </Field>
          <div className="admin-editor-readonly is-wide">
            <span>{labels.supplierReference}</span>
            <strong>{product.supplierPriceCents === null ? labels.unknown : formatMoney(product.supplierPriceCents)}</strong>
            {product.supplierPriceSourceName ? <small>{labels.source}: {product.supplierPriceSourceName}</small> : null}
          </div>
        </Section>
      </div>

      <div className="admin-editor-tab-panel" hidden={tab !== "stock"} role="tabpanel">
          <Section description={labels.stockHint} icon={<Boxes size={21} />} title={labels.stockHeading}>
            <Field label={labels.stockStatus}>
              <select name="stockStatus" onChange={(event) => update("stockStatus", event.target.value as AdminProductEditorValues["stockStatus"])} value={values.stockStatus}>
                <option value="unverified">{labels.unverified}</option>
                <option value="in_stock">{labels.inStock}</option>
                <option value="out_of_stock">{labels.outOfStock}</option>
                <option value="backorder">{labels.backorder}</option>
              </select>
            </Field>
            <Field error={errors.stockQuantity?.[0]} label={labels.quantity}>
              <input inputMode="numeric" name="stockQuantity" onChange={(event) => update("stockQuantity", event.target.value)} value={values.stockQuantity} />
            </Field>
            <Field error={errors.leadTimeDays?.[0]} label={labels.leadTime}>
              <input inputMode="numeric" name="leadTimeDays" onChange={(event) => update("leadTimeDays", event.target.value)} value={values.leadTimeDays} />
            </Field>
            <Field error={errors.warrantyMonths?.[0]} label={labels.warranty}>
              <input inputMode="numeric" name="warrantyMonths" onChange={(event) => update("warrantyMonths", event.target.value)} value={values.warrantyMonths} />
            </Field>
          </Section>
          <Section description={labels.activationHint} icon={<Sparkles size={21} />} title={labels.activation}>
            <ul className="admin-activation-checks is-wide">
              {activationChecks.map((check) => (
                <li className={check.complete ? "is-complete" : undefined} key={check.label}>
                  {check.complete ? <Check size={17} /> : <CircleAlert size={17} />}
                  {check.label}
                </li>
              ))}
            </ul>
          </Section>
      </div>

      <div className="admin-editor-tab-panel" hidden={tab !== "technical"} role="tabpanel">
          <Section description={labels.specs} icon={<Settings2 size={21} />} title={labels.technical}>
            <Field label={labels.householdMin}>
              <input inputMode="numeric" name="householdSizeMin" onChange={(event) => update("householdSizeMin", event.target.value)} value={values.householdSizeMin} />
            </Field>
            <Field error={errors.householdSizeMax?.[0]} label={labels.householdMax}>
              <input inputMode="numeric" name="householdSizeMax" onChange={(event) => update("householdSizeMax", event.target.value)} value={values.householdSizeMax} />
            </Field>
            <Field label={labels.resin}>
              <input inputMode="decimal" name="resinVolumeLiters" onChange={(event) => update("resinVolumeLiters", event.target.value)} value={values.resinVolumeLiters} />
            </Field>
            <Field label={labels.nominalFlow}>
              <input inputMode="decimal" name="nominalFlowLitersPerMinute" onChange={(event) => update("nominalFlowLitersPerMinute", event.target.value)} value={values.nominalFlowLitersPerMinute} />
            </Field>
            <Field label={labels.maxFlow}>
              <input inputMode="decimal" name="maxFlowLitersPerMinute" onChange={(event) => update("maxFlowLitersPerMinute", event.target.value)} value={values.maxFlowLitersPerMinute} />
            </Field>
            <Field label={labels.connection}>
              <input name="connectionSize" onChange={(event) => update("connectionSize", event.target.value)} value={values.connectionSize} />
            </Field>
            <Field label={labels.regeneration}>
              <input name="regenerationMode" onChange={(event) => update("regenerationMode", event.target.value)} value={values.regenerationMode} />
            </Field>
            <Field label={labels.salt}>
              <input inputMode="decimal" name="saltConsumptionKg" onChange={(event) => update("saltConsumptionKg", event.target.value)} value={values.saltConsumptionKg} />
            </Field>
            <Field label={labels.dimensions}>
              <input name="dimensions" onChange={(event) => update("dimensions", event.target.value)} value={values.dimensions} />
            </Field>
            <Field label={labels.weight}>
              <input inputMode="decimal" name="weightKg" onChange={(event) => update("weightKg", event.target.value)} value={values.weightKg} />
            </Field>
            <Field label={labels.drain}>
              <select name="drainRequired" onChange={(event) => update("drainRequired", event.target.value as "" | "true" | "false")} value={values.drainRequired}>
                <option value="">{labels.unknown}</option><option value="true">{labels.yes}</option><option value="false">{labels.no}</option>
              </select>
            </Field>
            <Field label={labels.electricity}>
              <select name="electricityRequired" onChange={(event) => update("electricityRequired", event.target.value as "" | "true" | "false")} value={values.electricityRequired}>
                <option value="">{labels.unknown}</option><option value="true">{labels.yes}</option><option value="false">{labels.no}</option>
              </select>
            </Field>
            <Field label={labels.bypass}>
              <select name="bypassIncluded" onChange={(event) => update("bypassIncluded", event.target.value as "" | "true" | "false")} value={values.bypassIncluded}>
                <option value="">{labels.unknown}</option><option value="true">{labels.yes}</option><option value="false">{labels.no}</option>
              </select>
            </Field>
            <Field label={labels.installation}>
              <select name="installationRequired" onChange={(event) => update("installationRequired", event.target.value as "true" | "false")} value={values.installationRequired}>
                <option value="true">{labels.yes}</option><option value="false">{labels.no}</option>
              </select>
            </Field>
            <Field error={errors.technicalSpecifications?.[0]} hint={labels.technicalListHint} label={labels.technicalList} wide>
              <textarea name="technicalSpecifications" onChange={(event) => update("technicalSpecifications", event.target.value)} rows={9} value={values.technicalSpecifications} />
            </Field>
            <Field hint={labels.lineHint} label={labels.certifications} wide>
              <textarea name="certifications" onChange={(event) => update("certifications", event.target.value)} rows={4} value={values.certifications} />
            </Field>
          </Section>
          <Section description={labels.mediaHint} icon={<ImageIcon size={21} />} title={labels.media}>
            <div className="admin-editor-media is-wide">
              <div className="admin-editor-media-preview">
                {product.image ? <Image alt={product.image.alt} fill sizes="160px" src={product.image.url} /> : <ImageIcon size={28} />}
              </div>
              <div><strong>{product.imageCount} {labels.images}</strong><span>{product.documentCount} {labels.documents}</span></div>
            </div>
          </Section>
      </div>

      <div className="admin-editor-savebar card">
        <div>
          <span className={dirty ? "is-dirty" : "is-saved"}>
            {dirty ? <CircleAlert size={16} /> : <Check size={16} />}
            {dirty ? labels.dirty : labels.saved}
          </span>
          {statusMessage ? <p className={isError ? "is-error" : "is-success"} role="status">{statusMessage}</p> : null}
        </div>
        <div>
          <button className="button button-secondary" onClick={resetLocal} type="button">
            <RotateCcw aria-hidden="true" size={16} />{labels.reset}
          </button>
          <button className="button button-primary" disabled={isPending} type="submit">
            <Save aria-hidden="true" size={16} />{isPending ? labels.saving : labels.save}
          </button>
        </div>
      </div>
    </form>
  );
}
