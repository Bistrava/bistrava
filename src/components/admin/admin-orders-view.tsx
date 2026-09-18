"use client";

import {
  ArrowRight,
  Banknote,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  CreditCard,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
  Truck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { useAdminLanguage } from "@/components/admin/admin-i18n";
import type {
  AdminAddress,
  AdminCommerceData,
  AdminOrder,
  AdminOrderStatus,
  AdminSavedAddress,
} from "@/lib/admin/orders";

type View = "orders" | "customers";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  profileId: string | null;
  orders: AdminOrder[];
  totalCents: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  locale: string | null;
  accountCreatedAt: string | null;
  savedAddresses: AdminSavedAddress[];
  lastShippingAddress: AdminAddress | null;
  lastBillingAddress: AdminAddress | null;
};

const copy = {
  sl: {
    kicker: "Prodaja in kupci",
    title: "Naročila",
    intro: "Celoten pregled naročil, kupcev, plačil, dostave in zgodovine obravnave.",
    demoTitle: "Fiktivni predstavitveni podatki",
    demoText: "Ti zapisi prikazujejo prihodnje delovanje. Samodejno jih bodo zamenjala resnična naročila po povezavi s Supabase.",
    unavailableTitle: "Podatkov trenutno ni mogoče prebrati",
    unavailableText: "Preverite povezavo in migracije Supabase. Nobeni osebni podatki niso bili prikazani.",
    privacy: "Dostop omejen na skrbnike in urednike. Podatki kupcev se ne pošiljajo v brskalnik javne trgovine.",
    orders: "Naročila",
    customers: "Kupci",
    revenue: "vrednost naročil",
    open: "odprtih naročil",
    awaiting: "čaka na plačilo",
    registered: "registriranih kupcev",
    searchOrders: "Iščite po referenci, imenu, e-pošti ali SKU",
    searchCustomers: "Iščite po imenu, e-pošti, telefonu ali podjetju",
    allStatuses: "Vsi statusi",
    reference: "Naročilo",
    customer: "Kupec",
    total: "Skupaj",
    payment: "Plačilo",
    delivery: "Dostava",
    status: "Status",
    details: "Podrobnosti",
    noOrders: "Ni naročil, ki bi ustrezala filtrom.",
    noCustomers: "Ni kupcev, ki bi ustrezali iskanju.",
    orderDetail: "Podrobnosti naročila",
    placed: "Oddano",
    updated: "Posodobljeno",
    contact: "Kontaktni podatki",
    registeredAccount: "Registriran račun",
    guest: "Gostujoči nakup",
    billingAddress: "Naslov za račun",
    shippingAddress: "Naslov za dostavo",
    items: "Naročeni izdelki",
    quantity: "Količina",
    unitPrice: "Cena na enoto",
    subtotal: "Vmesni seštevek",
    discount: "Popust",
    shipping: "Dostava",
    taxIncluded: "Vključen DDV",
    paymentDetail: "Podatki o plačilu",
    provider: "Ponudnik",
    transaction: "Referenca plačila",
    paidAt: "Plačano",
    refunded: "Vrnjeno",
    shipmentDetail: "Podatki o pošiljki",
    carrier: "Prevoznik",
    service: "Storitev",
    tracking: "Sledenje",
    notAssigned: "Ni dodeljeno",
    notes: "Opombe",
    customerNote: "Opomba kupca",
    internalNote: "Interna opomba",
    noNote: "Brez opombe",
    history: "Časovnica",
    created: "Naročilo ustvarjeno",
    paid: "Plačilo potrjeno",
    shipped: "Pošiljka odpremljena",
    delivered: "Pošiljka dostavljena",
    completed: "Naročilo zaključeno",
    cancelled: "Naročilo preklicano",
    customerFile: "Kartoteka kupca",
    ordersCount: "naročil",
    spent: "skupna vrednost",
    average: "povprečno naročilo",
    firstOrder: "prvo naročilo",
    lastOrder: "zadnje naročilo",
    language: "Jezik računa",
    accountCreated: "Račun ustvarjen",
    savedAddresses: "Shranjeni naslovi",
    defaultShipping: "Privzeti naslov za dostavo",
    defaultBilling: "Privzeti naslov za račun",
    noAddress: "Naslov ni shranjen",
    orderHistory: "Zgodovina naročil",
    viewOrder: "Odprite naročilo",
    pending: "Novo",
    awaiting_payment: "Čaka na plačilo",
    paidStatus: "Plačano",
    processing: "V pripravi",
    shippedStatus: "Poslano",
    completedStatus: "Zaključeno",
    cancelledStatus: "Preklicano",
    refundedStatus: "Vrnjeno",
    partially_refunded: "Delno vrnjeno",
  },
  fr: {
    kicker: "Ventes et clients",
    title: "Commandes",
    intro: "Vue complète des commandes, clients, paiements, livraisons et de leur historique de traitement.",
    demoTitle: "Données fictives de démonstration",
    demoText: "Ces données illustrent le fonctionnement futur. Elles seront automatiquement remplacées par les vraies commandes après la connexion à Supabase.",
    unavailableTitle: "Les données ne peuvent pas être consultées",
    unavailableText: "Vérifiez la connexion et les migrations Supabase. Aucune donnée personnelle n’a été affichée.",
    privacy: "Accès réservé aux administrateurs et éditeurs. Les données clients ne sont jamais envoyées au navigateur de la boutique publique.",
    orders: "Commandes",
    customers: "Clients",
    revenue: "de commandes",
    open: "commandes ouvertes",
    awaiting: "en attente de paiement",
    registered: "clients enregistrés",
    searchOrders: "Rechercher une référence, un nom, un e-mail ou un SKU",
    searchCustomers: "Rechercher un nom, un e-mail, un téléphone ou une entreprise",
    allStatuses: "Tous les statuts",
    reference: "Commande",
    customer: "Client",
    total: "Total",
    payment: "Paiement",
    delivery: "Livraison",
    status: "Statut",
    details: "Détails",
    noOrders: "Aucune commande ne correspond aux filtres.",
    noCustomers: "Aucun client ne correspond à la recherche.",
    orderDetail: "Détails de la commande",
    placed: "Passée le",
    updated: "Mise à jour",
    contact: "Coordonnées",
    registeredAccount: "Compte enregistré",
    guest: "Commande invité",
    billingAddress: "Adresse de facturation",
    shippingAddress: "Adresse de livraison",
    items: "Produits commandés",
    quantity: "Quantité",
    unitPrice: "Prix unitaire",
    subtotal: "Sous-total",
    discount: "Remise",
    shipping: "Livraison",
    taxIncluded: "TVA incluse",
    paymentDetail: "Informations de paiement",
    provider: "Prestataire",
    transaction: "Référence du paiement",
    paidAt: "Payé le",
    refunded: "Remboursé",
    shipmentDetail: "Informations de livraison",
    carrier: "Transporteur",
    service: "Service",
    tracking: "Suivi",
    notAssigned: "Non renseigné",
    notes: "Notes",
    customerNote: "Note du client",
    internalNote: "Note interne",
    noNote: "Aucune note",
    history: "Historique",
    created: "Commande créée",
    paid: "Paiement confirmé",
    shipped: "Colis expédié",
    delivered: "Colis livré",
    completed: "Commande terminée",
    cancelled: "Commande annulée",
    customerFile: "Fiche client",
    ordersCount: "commandes",
    spent: "valeur totale",
    average: "commande moyenne",
    firstOrder: "première commande",
    lastOrder: "dernière commande",
    language: "Langue du compte",
    accountCreated: "Compte créé le",
    savedAddresses: "Adresses enregistrées",
    defaultShipping: "Adresse de livraison par défaut",
    defaultBilling: "Adresse de facturation par défaut",
    noAddress: "Aucune adresse enregistrée",
    orderHistory: "Historique des commandes",
    viewOrder: "Ouvrir la commande",
    pending: "Nouvelle",
    awaiting_payment: "Paiement en attente",
    paidStatus: "Payée",
    processing: "En préparation",
    shippedStatus: "Expédiée",
    completedStatus: "Terminée",
    cancelledStatus: "Annulée",
    refundedStatus: "Remboursée",
    partially_refunded: "Partiellement remboursée",
  },
} as const;

const statusTone: Record<AdminOrderStatus, "waiting" | "ready" | "neutral" | "danger"> = {
  pending: "waiting",
  awaiting_payment: "waiting",
  paid: "ready",
  processing: "neutral",
  shipped: "neutral",
  completed: "ready",
  cancelled: "danger",
  refunded: "danger",
  partially_refunded: "danger",
};

const paymentStatusCopy: Record<string, { sl: string; fr: string }> = {
  pending: { sl: "Čaka", fr: "En attente" },
  requires_action: { sl: "Potrebno dejanje", fr: "Action requise" },
  authorized: { sl: "Odobreno", fr: "Autorisé" },
  paid: { sl: "Plačano", fr: "Payé" },
  failed: { sl: "Neuspešno", fr: "Échoué" },
  cancelled: { sl: "Preklicano", fr: "Annulé" },
  refunded: { sl: "Vrnjeno", fr: "Remboursé" },
  partially_refunded: { sl: "Delno vrnjeno", fr: "Partiellement remboursé" },
};

const shipmentStatusCopy: Record<string, { sl: string; fr: string }> = {
  pending: { sl: "Čaka", fr: "En attente" },
  ready: { sl: "Pripravljeno", fr: "Prêt" },
  shipped: { sl: "Poslano", fr: "Expédié" },
  in_transit: { sl: "Na poti", fr: "En transit" },
  delivered: { sl: "Dostavljeno", fr: "Livré" },
  returned: { sl: "Vrnjeno", fr: "Retourné" },
  cancelled: { sl: "Preklicano", fr: "Annulé" },
};

function customerName(order: AdminOrder) {
  const name = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  return name || order.email;
}

function addressLines(address: AdminAddress) {
  return [
    `${address.firstName} ${address.lastName}`.trim(),
    address.company,
    address.addressLine1,
    address.addressLine2,
    `${address.postalCode} ${address.city}`.trim(),
    address.countryCode,
  ].filter(Boolean) as string[];
}

function createCustomers(
  orders: AdminOrder[],
  profiles: AdminCommerceData["profiles"],
): Customer[] {
  const customers = new Map<string, Customer>();
  for (const profile of profiles) {
    if (!profile.email) continue;
    const key = profile.email.toLocaleLowerCase();
    customers.set(key, {
      id: profile.id,
      name: profile.fullName || profile.email,
      email: profile.email,
      phone: profile.phone,
      company: profile.addresses.find((item) => item.defaultBilling)?.company ?? profile.addresses[0]?.company ?? null,
      profileId: profile.id,
      orders: [],
      totalCents: 0,
      firstOrderAt: null,
      lastOrderAt: null,
      locale: profile.locale,
      accountCreatedAt: profile.createdAt,
      savedAddresses: profile.addresses,
      lastShippingAddress: profile.addresses.find((item) => item.defaultShipping) ?? profile.addresses[0] ?? null,
      lastBillingAddress: profile.addresses.find((item) => item.defaultBilling) ?? profile.addresses[0] ?? null,
    });
  }
  for (const order of orders) {
    const key = order.email.toLocaleLowerCase();
    const existing = customers.get(key);
    if (existing) {
      existing.orders.push(order);
      if (!['cancelled', 'refunded'].includes(order.status)) existing.totalCents += order.totalCents;
      existing.firstOrderAt = !existing.firstOrderAt || existing.firstOrderAt > order.createdAt ? order.createdAt : existing.firstOrderAt;
      if (!existing.lastOrderAt || existing.lastOrderAt < order.createdAt) {
        existing.lastOrderAt = order.createdAt;
        existing.lastShippingAddress = order.shippingAddress;
        existing.lastBillingAddress = order.billingAddress;
      }
      continue;
    }
    customers.set(key, {
      id: order.profileId || key,
      name: customerName(order),
      email: order.email,
      phone: order.phone,
      company: order.shippingAddress.company,
      profileId: order.profileId,
      orders: [order],
      totalCents: ['cancelled', 'refunded'].includes(order.status) ? 0 : order.totalCents,
      firstOrderAt: order.createdAt,
      lastOrderAt: order.createdAt,
      locale: null,
      accountCreatedAt: null,
      savedAddresses: [],
      lastShippingAddress: order.shippingAddress,
      lastBillingAddress: order.billingAddress,
    });
  }
  return Array.from(customers.values()).toSorted((a, b) => (b.lastOrderAt ?? b.accountCreatedAt ?? "").localeCompare(a.lastOrderAt ?? a.accountCreatedAt ?? ""));
}

function AddressBlock({ address }: { address: AdminAddress }) {
  return <address>{addressLines(address).map((line) => <span key={line}>{line}</span>)}</address>;
}

export function AdminOrdersView({ data }: { data: AdminCommerceData }) {
  const { locale } = useAdminLanguage();
  const labels = copy[locale];
  const [view, setView] = useState<View>("orders");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase(locale));
  const [status, setStatus] = useState<"all" | AdminOrderStatus>("all");
  const [selectedOrderId, setSelectedOrderId] = useState(data.orders[0]?.id ?? "");
  const customers = useMemo(
    () => createCustomers(data.orders, data.profiles),
    [data.orders, data.profiles],
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? "");

  const filteredOrders = useMemo(() => data.orders.filter((order) => {
    const matchesStatus = status === "all" || order.status === status;
    const content = `${order.reference} ${customerName(order)} ${order.email} ${order.phone ?? ""} ${order.items.map((item) => item.sku).join(" ")}`.toLocaleLowerCase(locale);
    return matchesStatus && (!deferredQuery || content.includes(deferredQuery));
  }), [data.orders, deferredQuery, locale, status]);
  const filteredCustomers = useMemo(() => customers.filter((customer) => {
    const content = `${customer.name} ${customer.email} ${customer.phone ?? ""} ${customer.company ?? ""}`.toLocaleLowerCase(locale);
    return !deferredQuery || content.includes(deferredQuery);
  }), [customers, deferredQuery, locale]);
  const selectedOrder = filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0] ?? null;
  const selectedCustomer = filteredCustomers.find((customer) => customer.id === selectedCustomerId) ?? filteredCustomers[0] ?? null;

  const formatMoney = (cents: number) => new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "sl-SI", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
  const formatDate = (value: string | null) => value
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "sl-SI", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : labels.notAssigned;
  const statusLabel = (value: AdminOrderStatus) => {
    const keys = {
      pending: "pending",
      awaiting_payment: "awaiting_payment",
      paid: "paidStatus",
      processing: "processing",
      shipped: "shippedStatus",
      completed: "completedStatus",
      cancelled: "cancelledStatus",
      refunded: "refundedStatus",
      partially_refunded: "partially_refunded",
    } as const;
    return labels[keys[value]];
  };
  const paymentStatusLabel = (value: string | null | undefined) => value
    ? paymentStatusCopy[value]?.[locale] ?? value
    : labels.notAssigned;
  const shipmentStatusLabel = (value: string | null | undefined) => value
    ? shipmentStatusCopy[value]?.[locale] ?? value
    : labels.notAssigned;
  const providerLabel = (value: string | null | undefined) => value === "manual_review"
    ? locale === "fr" ? "Validation manuelle" : "Ročni pregled"
    : value || labels.notAssigned;
  const activeOrders = data.orders.filter((order) => !["completed", "cancelled", "refunded"].includes(order.status)).length;
  const totalValue = data.orders.filter((order) => !["cancelled", "refunded"].includes(order.status)).reduce((sum, order) => sum + order.totalCents, 0);

  return (
    <div className="admin-orders">
      {data.source !== "live" ? (
        <div className={`admin-preview-banner ${data.source === "unavailable" ? "is-error" : ""}`} role="status">
          {data.source === "preview" ? <CircleAlert aria-hidden="true" size={19} /> : <ShieldCheck aria-hidden="true" size={19} />}
          <div>
            <strong>{data.source === "preview" ? labels.demoTitle : labels.unavailableTitle}</strong>
            <span>{data.source === "preview" ? labels.demoText : labels.unavailableText}</span>
          </div>
        </div>
      ) : null}

      <header className="admin-page-heading admin-orders-heading">
        <div>
          <p className="section-kicker">{labels.kicker}</p>
          <h1>{labels.title}</h1>
          <p>{labels.intro}</p>
        </div>
        <span className="admin-section-hero-icon"><ClipboardList aria-hidden="true" size={28} /></span>
      </header>

      <div className="admin-data-privacy"><ShieldCheck aria-hidden="true" size={17} /><span>{labels.privacy}</span></div>

      <section aria-label={labels.title} className="admin-stat-grid admin-order-metrics">
        <article className="admin-stat-card card"><span className="admin-stat-icon is-teal"><Banknote size={22} /></span><div><strong>{formatMoney(totalValue)}</strong><span>{labels.revenue}</span></div><small>{data.orders.length} {labels.orders.toLocaleLowerCase(locale)}</small></article>
        <article className="admin-stat-card card"><span className="admin-stat-icon is-navy"><PackageCheck size={22} /></span><div><strong>{activeOrders}</strong><span>{labels.open}</span></div><small>{data.orders.filter((order) => order.status === "processing").length} {labels.processing.toLocaleLowerCase(locale)}</small></article>
        <article className="admin-stat-card card"><span className="admin-stat-icon is-amber"><CreditCard size={22} /></span><div><strong>{data.orders.filter((order) => order.status === "awaiting_payment").length}</strong><span>{labels.awaiting}</span></div><small>{data.orders.filter((order) => order.payment?.status === "paid").length} {labels.paidStatus.toLocaleLowerCase(locale)}</small></article>
        <article className="admin-stat-card card"><span className="admin-stat-icon is-soft"><UsersRound size={22} /></span><div><strong>{customers.length}</strong><span>{labels.customers.toLocaleLowerCase(locale)}</span></div><small>{customers.filter((customer) => customer.profileId).length} {labels.registered}</small></article>
      </section>

      <div className="admin-order-tabs" role="tablist" aria-label={labels.title}>
        <button aria-selected={view === "orders"} className={view === "orders" ? "is-active" : undefined} onClick={() => { setView("orders"); setQuery(""); }} role="tab" type="button"><ClipboardList size={18} />{labels.orders}<b>{data.orders.length}</b></button>
        <button aria-selected={view === "customers"} className={view === "customers" ? "is-active" : undefined} onClick={() => { setView("customers"); setQuery(""); }} role="tab" type="button"><UsersRound size={18} />{labels.customers}<b>{customers.length}</b></button>
      </div>

      <div className="admin-order-filters card">
        <label className="admin-search-field"><span>{view === "orders" ? labels.orders : labels.customers}</span><span className="admin-search-input"><Search aria-hidden="true" size={19} /><input onChange={(event) => setQuery(event.target.value)} placeholder={view === "orders" ? labels.searchOrders : labels.searchCustomers} type="search" value={query} /></span></label>
        {view === "orders" ? <label><span>{labels.status}</span><select onChange={(event) => setStatus(event.target.value as "all" | AdminOrderStatus)} value={status}><option value="all">{labels.allStatuses}</option>{(Object.keys(statusTone) as AdminOrderStatus[]).map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label> : null}
      </div>

      {view === "orders" ? (
        <div className="admin-order-workspace" role="tabpanel">
          <section className="admin-order-list card">
            <div className="admin-order-list-head"><span>{labels.reference}</span><span>{labels.customer}</span><span>{labels.total}</span><span>{labels.payment}</span><span>{labels.status}</span></div>
            {filteredOrders.map((order) => (
              <button className={selectedOrder?.id === order.id ? "is-selected" : undefined} key={order.id} onClick={() => setSelectedOrderId(order.id)} type="button">
                <span><strong>{order.reference}</strong><small>{formatDate(order.placedAt || order.createdAt)}</small></span>
                <span><strong>{customerName(order)}</strong><small>{order.email}</small></span>
                <strong>{formatMoney(order.totalCents)}</strong>
                <span><strong>{paymentStatusLabel(order.payment?.status)}</strong><small>{providerLabel(order.payment?.provider)}</small></span>
                <span className={`admin-order-status is-${statusTone[order.status]}`}>{statusLabel(order.status)}</span>
                <ArrowRight aria-label={labels.details} size={17} />
              </button>
            ))}
            {filteredOrders.length === 0 ? <p className="admin-operational-empty">{labels.noOrders}</p> : null}
          </section>
          {selectedOrder ? <OrderDetail formatDate={formatDate} formatMoney={formatMoney} labels={labels} order={selectedOrder} paymentStatusLabel={paymentStatusLabel} providerLabel={providerLabel} shipmentStatusLabel={shipmentStatusLabel} statusLabel={statusLabel} /> : null}
        </div>
      ) : (
        <div className="admin-order-workspace" role="tabpanel">
          <section className="admin-customer-list card">
            {filteredCustomers.map((customer) => (
              <button className={selectedCustomer?.id === customer.id ? "is-selected" : undefined} key={customer.id} onClick={() => setSelectedCustomerId(customer.id)} type="button">
                <span className="admin-customer-avatar"><UserRound size={19} /></span>
                <span><strong>{customer.name}</strong><small>{customer.email}</small></span>
                <span><strong>{customer.orders.length}</strong><small>{labels.ordersCount}</small></span>
                <span><strong>{formatMoney(customer.totalCents)}</strong><small>{labels.spent}</small></span>
                <ArrowRight aria-label={labels.details} size={17} />
              </button>
            ))}
            {filteredCustomers.length === 0 ? <p className="admin-operational-empty">{labels.noCustomers}</p> : null}
          </section>
          {selectedCustomer ? <CustomerDetail customer={selectedCustomer} formatDate={formatDate} formatMoney={formatMoney} labels={labels} onOpenOrder={(id) => { setSelectedOrderId(id); setView("orders"); setQuery(""); }} statusLabel={statusLabel} /> : null}
        </div>
      )}
    </div>
  );
}

type Labels = typeof copy.sl | typeof copy.fr;

function OrderDetail({ order, labels, formatDate, formatMoney, statusLabel, paymentStatusLabel, shipmentStatusLabel, providerLabel }: { order: AdminOrder; labels: Labels; formatDate: (value: string | null) => string; formatMoney: (value: number) => string; statusLabel: (value: AdminOrderStatus) => string; paymentStatusLabel: (value: string | null | undefined) => string; shipmentStatusLabel: (value: string | null | undefined) => string; providerLabel: (value: string | null | undefined) => string }) {
  const timeline = [
    { label: labels.created, date: order.createdAt },
    { label: labels.paid, date: order.payment?.paidAt ?? null },
    { label: labels.shipped, date: order.shipment?.shippedAt ?? null },
    { label: labels.delivered, date: order.shipment?.deliveredAt ?? null },
    { label: labels.completed, date: order.completedAt },
    { label: labels.cancelled, date: order.cancelledAt },
  ].flatMap((event) => event.date ? [{ label: event.label, date: event.date }] : []);

  return (
    <aside className="admin-order-detail card" aria-label={labels.orderDetail}>
      <header><div><p className="section-kicker">{labels.orderDetail}</p><h2>{order.reference}</h2><span>{labels.placed}: {formatDate(order.placedAt || order.createdAt)} · {labels.updated}: {formatDate(order.updatedAt)}</span></div><span className={`admin-order-status is-${statusTone[order.status]}`}>{statusLabel(order.status)}</span></header>
      <div className="admin-order-detail-grid">
        <section><h3><UserRound size={17} />{labels.contact}</h3><p><strong>{customerName(order)}</strong>{order.shippingAddress.company ? <span>{order.shippingAddress.company}</span> : null}<span><Mail size={14} />{order.email}</span>{order.phone ? <span><Phone size={14} />{order.phone}</span> : null}<small>{order.profileId ? labels.registeredAccount : labels.guest}</small></p></section>
        <section><h3><MapPin size={17} />{labels.billingAddress}</h3><AddressBlock address={order.billingAddress} /></section>
        <section><h3><Truck size={17} />{labels.shippingAddress}</h3><AddressBlock address={order.shippingAddress} /></section>
      </div>
      <section className="admin-order-items"><h3><Boxes size={17} />{labels.items}</h3>{order.items.map((item) => <div key={item.id}><span><strong>{item.productName}</strong><small>{item.sku} · {item.variantName}</small></span><span>{item.quantity} × {formatMoney(item.unitPriceCents)}</span><strong>{formatMoney(item.lineTotalCents)}</strong></div>)}</section>
      <div className="admin-order-finance-grid">
        <section><h3><Banknote size={17} />{labels.total}</h3><dl><div><dt>{labels.subtotal}</dt><dd>{formatMoney(order.subtotalCents)}</dd></div><div><dt>{labels.discount}</dt><dd>− {formatMoney(order.discountCents)}</dd></div><div><dt>{labels.shipping}</dt><dd>{formatMoney(order.shippingCents)}</dd></div><div><dt>{labels.taxIncluded}</dt><dd>{formatMoney(order.taxCents)}</dd></div><div><dt>{labels.total}</dt><dd>{formatMoney(order.totalCents)}</dd></div></dl></section>
        <section><h3><CreditCard size={17} />{labels.paymentDetail}</h3><dl><div><dt>{labels.status}</dt><dd>{paymentStatusLabel(order.payment?.status)}</dd></div><div><dt>{labels.provider}</dt><dd>{providerLabel(order.payment?.provider)}</dd></div><div><dt>{labels.transaction}</dt><dd>{order.payment?.providerReference ?? labels.notAssigned}</dd></div><div><dt>{labels.paidAt}</dt><dd>{formatDate(order.payment?.paidAt ?? null)}</dd></div><div><dt>{labels.refunded}</dt><dd>{formatMoney(order.payment?.refundedCents ?? 0)}</dd></div></dl></section>
        <section><h3><Truck size={17} />{labels.shipmentDetail}</h3><dl><div><dt>{labels.status}</dt><dd>{shipmentStatusLabel(order.shipment?.status)}</dd></div><div><dt>{labels.carrier}</dt><dd>{order.shipment?.carrier ?? labels.notAssigned}</dd></div><div><dt>{labels.service}</dt><dd>{order.shipment?.service ?? labels.notAssigned}</dd></div><div><dt>{labels.tracking}</dt><dd>{order.shipment?.trackingNumber ?? labels.notAssigned}</dd></div></dl></section>
      </div>
      <div className="admin-order-bottom-grid">
        <section><h3><ClipboardList size={17} />{labels.notes}</h3><div><strong>{labels.customerNote}</strong><p>{order.customerNote ?? labels.noNote}</p></div><div><strong>{labels.internalNote}</strong><p>{order.internalNote ?? labels.noNote}</p></div></section>
        <section><h3><CalendarDays size={17} />{labels.history}</h3><ol>{timeline.map((event) => <li key={`${event.label}-${event.date}`}><CheckCircle2 size={16} /><span><strong>{event.label}</strong><small>{formatDate(event.date)}</small></span></li>)}</ol></section>
      </div>
    </aside>
  );
}

function CustomerDetail({ customer, labels, formatDate, formatMoney, statusLabel, onOpenOrder }: { customer: Customer; labels: Labels; formatDate: (value: string | null) => string; formatMoney: (value: number) => string; statusLabel: (value: AdminOrderStatus) => string; onOpenOrder: (id: string) => void }) {
  const average = customer.orders.length ? Math.round(customer.totalCents / customer.orders.length) : 0;
  return (
    <aside className="admin-order-detail admin-customer-detail card" aria-label={labels.customerFile}>
      <header><div><p className="section-kicker">{labels.customerFile}</p><h2>{customer.name}</h2><span>{customer.profileId ? labels.registeredAccount : labels.guest}</span></div><span className="admin-customer-avatar"><UserRound size={22} /></span></header>
      <div className="admin-customer-summary"><div><strong>{customer.orders.length}</strong><span>{labels.ordersCount}</span></div><div><strong>{formatMoney(customer.totalCents)}</strong><span>{labels.spent}</span></div><div><strong>{formatMoney(average)}</strong><span>{labels.average}</span></div></div>
      <div className="admin-order-detail-grid"><section><h3><UserRound size={17} />{labels.contact}</h3><p><strong>{customer.name}</strong>{customer.company ? <span>{customer.company}</span> : null}<span><Mail size={14} />{customer.email}</span>{customer.phone ? <span><Phone size={14} />{customer.phone}</span> : null}{customer.locale ? <span>{labels.language}: {customer.locale}</span> : null}{customer.accountCreatedAt ? <small>{labels.accountCreated}: {formatDate(customer.accountCreatedAt)}</small> : null}</p></section><section><h3><Truck size={17} />{labels.shippingAddress}</h3>{customer.lastShippingAddress ? <AddressBlock address={customer.lastShippingAddress} /> : <p>{labels.noAddress}</p>}</section><section><h3><MapPin size={17} />{labels.billingAddress}</h3>{customer.lastBillingAddress ? <AddressBlock address={customer.lastBillingAddress} /> : <p>{labels.noAddress}</p>}</section></div>
      <div className="admin-customer-dates"><span><small>{labels.firstOrder}</small><strong>{formatDate(customer.firstOrderAt)}</strong></span><span><small>{labels.lastOrder}</small><strong>{formatDate(customer.lastOrderAt)}</strong></span></div>
      {customer.savedAddresses.length ? <section className="admin-saved-addresses"><h3><MapPin size={17} />{labels.savedAddresses}</h3><div>{customer.savedAddresses.map((address) => <article key={address.id}><strong>{address.label ?? labels.savedAddresses}</strong><AddressBlock address={address} /><small>{[address.defaultShipping ? labels.defaultShipping : null, address.defaultBilling ? labels.defaultBilling : null].filter(Boolean).join(" · ")}</small></article>)}</div></section> : null}
      <section className="admin-customer-history"><h3><ClipboardList size={17} />{labels.orderHistory}</h3>{customer.orders.length ? customer.orders.map((order) => <button key={order.id} onClick={() => onOpenOrder(order.id)} type="button"><span><strong>{order.reference}</strong><small>{formatDate(order.createdAt)}</small></span><span className={`admin-order-status is-${statusTone[order.status]}`}>{statusLabel(order.status)}</span><strong>{formatMoney(order.totalCents)}</strong><ArrowRight aria-label={labels.viewOrder} size={16} /></button>) : <p className="admin-operational-empty">{labels.noOrders}</p>}</section>
    </aside>
  );
}
