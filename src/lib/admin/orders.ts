export type AdminOrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type AdminAddress = {
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
};

export type AdminSavedAddress = AdminAddress & {
  id: string;
  label: string | null;
  defaultShipping: boolean;
  defaultBilling: boolean;
};

export type AdminCustomerProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
  addresses: AdminSavedAddress[];
};

export type AdminOrderItem = {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  taxCents: number;
  lineTotalCents: number;
};

export type AdminPaymentSummary = {
  provider: string;
  providerReference: string | null;
  status: string;
  amountCents: number;
  refundedCents: number;
  paidAt: string | null;
};

export type AdminShipmentSummary = {
  status: string;
  carrier: string | null;
  service: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
};

export type AdminOrder = {
  id: string;
  reference: string;
  profileId: string | null;
  status: AdminOrderStatus;
  email: string;
  phone: string | null;
  currency: "EUR";
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  billingAddress: AdminAddress;
  shippingAddress: AdminAddress;
  customerNote: string | null;
  internalNote: string | null;
  checkoutMode: string;
  placedAt: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  completedAt: string | null;
  items: AdminOrderItem[];
  payment: AdminPaymentSummary | null;
  shipment: AdminShipmentSummary | null;
};

export type AdminCommerceData = {
  source: "preview" | "live" | "unavailable";
  orders: AdminOrder[];
  profiles: AdminCustomerProfile[];
};

const address = (
  firstName: string,
  lastName: string,
  addressLine1: string,
  postalCode: string,
  city: string,
  company: string | null = null,
): AdminAddress => ({
  firstName,
  lastName,
  company,
  addressLine1,
  addressLine2: null,
  postalCode,
  city,
  countryCode: "SI",
});

/** Fictional records used only by the local administration preview. */
export const previewOrders: AdminOrder[] = [
  {
    id: "preview-order-1",
    reference: "BIS-DEMO-1042",
    profileId: "preview-customer-1",
    status: "processing",
    email: "nina.kovac@example.com",
    phone: "+386 40 555 104",
    currency: "EUR",
    subtotalCents: 124900,
    discountCents: 5000,
    shippingCents: 0,
    taxCents: 21621,
    totalCents: 119900,
    billingAddress: address("Nina", "Kovač", "Dunajska cesta 100", "1000", "Ljubljana", "Domus Primer d.o.o."),
    shippingAddress: address("Nina", "Kovač", "Dunajska cesta 100", "1000", "Ljubljana", "Domus Primer d.o.o."),
    customerNote: "Prosim za klic pred dostavo in uskladitev termina montaže.",
    internalNote: "Montažni ogled potrjen za četrtek ob 10.00.",
    checkoutMode: "manual_review",
    placedAt: "2026-09-13T08:32:00.000Z",
    createdAt: "2026-09-13T08:32:00.000Z",
    updatedAt: "2026-09-13T14:10:00.000Z",
    cancelledAt: null,
    completedAt: null,
    items: [
      { id: "preview-item-1", productName: "Aquaphor S550 P1", variantName: "Standardna izvedba", sku: "BIS-016", quantity: 1, unitPriceCents: 119900, taxCents: 21621, lineTotalCents: 119900 },
    ],
    payment: { provider: "manual_review", providerReference: "DEMO-PAY-1042", status: "paid", amountCents: 119900, refundedCents: 0, paidAt: "2026-09-13T09:05:00.000Z" },
    shipment: { status: "ready", carrier: "Bistrava montaža", service: "Dostava z montažo", trackingNumber: null, trackingUrl: null, shippedAt: null, deliveredAt: null },
  },
  {
    id: "preview-order-2",
    reference: "BIS-DEMO-1041",
    profileId: null,
    status: "awaiting_payment",
    email: "marko.novak@example.com",
    phone: "+386 31 555 241",
    currency: "EUR",
    subtotalCents: 4480,
    discountCents: 0,
    shippingCents: 590,
    taxCents: 830,
    totalCents: 5070,
    billingAddress: address("Marko", "Novak", "Tržaška cesta 22", "2000", "Maribor"),
    shippingAddress: address("Marko", "Novak", "Tržaška cesta 22", "2000", "Maribor"),
    customerNote: null,
    internalNote: "Čaka na potrditev bančnega nakazila.",
    checkoutMode: "manual_review",
    placedAt: "2026-09-12T16:18:00.000Z",
    createdAt: "2026-09-12T16:18:00.000Z",
    updatedAt: "2026-09-12T16:18:00.000Z",
    cancelledAt: null,
    completedAt: null,
    items: [
      { id: "preview-item-2", productName: "Tabletirana sol za mehčalne naprave 25 kg", variantName: "25 kg", sku: "BIS-030", quantity: 2, unitPriceCents: 2240, taxCents: 808, lineTotalCents: 4480 },
    ],
    payment: { provider: "manual_review", providerReference: null, status: "pending", amountCents: 5070, refundedCents: 0, paidAt: null },
    shipment: { status: "pending", carrier: null, service: "Standardna dostava", trackingNumber: null, trackingUrl: null, shippedAt: null, deliveredAt: null },
  },
  {
    id: "preview-order-3",
    reference: "BIS-DEMO-1038",
    profileId: "preview-customer-1",
    status: "completed",
    email: "nina.kovac@example.com",
    phone: "+386 40 555 104",
    currency: "EUR",
    subtotalCents: 2990,
    discountCents: 0,
    shippingCents: 590,
    taxCents: 646,
    totalCents: 3580,
    billingAddress: address("Nina", "Kovač", "Dunajska cesta 100", "1000", "Ljubljana", "Domus Primer d.o.o."),
    shippingAddress: address("Nina", "Kovač", "Dunajska cesta 100", "1000", "Ljubljana", "Domus Primer d.o.o."),
    customerNote: null,
    internalNote: null,
    checkoutMode: "manual_review",
    placedAt: "2026-08-27T10:40:00.000Z",
    createdAt: "2026-08-27T10:40:00.000Z",
    updatedAt: "2026-08-29T15:12:00.000Z",
    cancelledAt: null,
    completedAt: "2026-08-29T15:12:00.000Z",
    items: [
      { id: "preview-item-3", productName: "Kapljice za merjenje trdote vode °frH", variantName: "Standardni komplet", sku: "BIS-008", quantity: 1, unitPriceCents: 2990, taxCents: 539, lineTotalCents: 2990 },
    ],
    payment: { provider: "manual_review", providerReference: "DEMO-PAY-1038", status: "paid", amountCents: 3580, refundedCents: 0, paidAt: "2026-08-27T11:03:00.000Z" },
    shipment: { status: "delivered", carrier: "Pošta Slovenije", service: "Paket", trackingNumber: "DEMO1038SI", trackingUrl: null, shippedAt: "2026-08-28T08:10:00.000Z", deliveredAt: "2026-08-29T13:44:00.000Z" },
  },
  {
    id: "preview-order-4",
    reference: "BIS-DEMO-1035",
    profileId: null,
    status: "cancelled",
    email: "tina.zupan@example.com",
    phone: "+386 51 555 309",
    currency: "EUR",
    subtotalCents: 1890,
    discountCents: 0,
    shippingCents: 590,
    taxCents: 447,
    totalCents: 2480,
    billingAddress: address("Tina", "Zupan", "Cankarjeva ulica 7", "6000", "Koper"),
    shippingAddress: address("Tina", "Zupan", "Cankarjeva ulica 7", "6000", "Koper"),
    customerNote: "Dostava po 16. uri.",
    internalNote: "Stranka je naročilo preklicala pred plačilom.",
    checkoutMode: "manual_review",
    placedAt: "2026-08-21T07:50:00.000Z",
    createdAt: "2026-08-21T07:50:00.000Z",
    updatedAt: "2026-08-21T09:06:00.000Z",
    cancelledAt: "2026-08-21T09:06:00.000Z",
    completedAt: null,
    items: [
      { id: "preview-item-4", productName: "Testni lističi za trdoto vode", variantName: "Standardni komplet", sku: "BIS-086", quantity: 1, unitPriceCents: 1890, taxCents: 341, lineTotalCents: 1890 },
    ],
    payment: { provider: "manual_review", providerReference: null, status: "cancelled", amountCents: 2480, refundedCents: 0, paidAt: null },
    shipment: null,
  },
];

export const previewCustomerProfiles: AdminCustomerProfile[] = [
  {
    id: "preview-customer-1",
    email: "nina.kovac@example.com",
    fullName: "Nina Kovač",
    phone: "+386 40 555 104",
    locale: "sl-SI",
    createdAt: "2026-08-20T12:15:00.000Z",
    updatedAt: "2026-09-13T08:32:00.000Z",
    addresses: [
      {
        id: "preview-address-1",
        label: "Podjetje",
        defaultShipping: true,
        defaultBilling: true,
        ...address("Nina", "Kovač", "Dunajska cesta 100", "1000", "Ljubljana", "Domus Primer d.o.o."),
      },
    ],
  },
];
