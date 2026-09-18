import "server-only";

import {
  previewCustomerProfiles,
  previewOrders,
  type AdminAddress,
  type AdminCommerceData,
  type AdminCustomerProfile,
  type AdminOrder,
  type AdminOrderStatus,
} from "@/lib/admin/orders";
import { createClient } from "@/lib/supabase/server";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableText(value: unknown) {
  const normalized = text(value);
  return normalized || null;
}

function address(value: unknown): AdminAddress {
  const source = record(value);
  return {
    firstName: text(source.firstName ?? source.first_name),
    lastName: text(source.lastName ?? source.last_name),
    company: nullableText(source.company),
    addressLine1: text(source.addressLine1 ?? source.address_line_1),
    addressLine2: nullableText(source.addressLine2 ?? source.address_line_2),
    postalCode: text(source.postalCode ?? source.postal_code),
    city: text(source.city),
    countryCode: text(source.countryCode ?? source.country_code) || "SI",
  };
}

function latest<T extends UnknownRecord>(values: unknown, dateField = "created_at") {
  if (!Array.isArray(values)) return null;
  return values
    .filter((item): item is T => Boolean(item && typeof item === "object" && !Array.isArray(item)))
    .toSorted((a, b) => text(b[dateField]).localeCompare(text(a[dateField])))[0] ?? null;
}

function mapOrder(row: UnknownRecord): AdminOrder {
  const payment = latest<UnknownRecord>(row.payments);
  const shipment = latest<UnknownRecord>(row.shipments);
  const items = Array.isArray(row.order_items) ? row.order_items : [];

  return {
    id: text(row.id),
    reference: text(row.reference),
    profileId: nullableText(row.profile_id),
    status: text(row.status) as AdminOrderStatus,
    email: text(row.email),
    phone: nullableText(row.phone),
    currency: "EUR",
    subtotalCents: Number(row.subtotal_cents) || 0,
    discountCents: Number(row.discount_cents) || 0,
    shippingCents: Number(row.shipping_cents) || 0,
    taxCents: Number(row.tax_cents) || 0,
    totalCents: Number(row.total_cents) || 0,
    billingAddress: address(row.billing_address_snapshot),
    shippingAddress: address(row.shipping_address_snapshot),
    customerNote: nullableText(row.customer_note),
    internalNote: nullableText(row.internal_note),
    checkoutMode: text(row.checkout_mode),
    placedAt: nullableText(row.placed_at),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
    cancelledAt: nullableText(row.cancelled_at),
    completedAt: nullableText(row.completed_at),
    items: items.map((value) => {
      const item = record(value);
      return {
        id: text(item.id),
        productName: text(item.product_name),
        variantName: text(item.variant_name),
        sku: text(item.sku),
        quantity: Number(item.quantity) || 0,
        unitPriceCents: Number(item.unit_price_cents) || 0,
        taxCents: Number(item.tax_cents) || 0,
        lineTotalCents: Number(item.line_total_cents) || 0,
      };
    }),
    payment: payment ? {
      provider: text(payment.provider),
      providerReference: nullableText(payment.provider_reference),
      status: text(payment.status),
      amountCents: Number(payment.amount_cents) || 0,
      refundedCents: Number(payment.refunded_cents) || 0,
      paidAt: nullableText(payment.paid_at),
    } : null,
    shipment: shipment ? {
      status: text(shipment.status),
      carrier: nullableText(shipment.carrier),
      service: nullableText(shipment.service),
      trackingNumber: nullableText(shipment.tracking_number),
      trackingUrl: nullableText(shipment.tracking_url),
      shippedAt: nullableText(shipment.shipped_at),
      deliveredAt: nullableText(shipment.delivered_at),
    } : null,
  };
}

function mapProfile(row: UnknownRecord): AdminCustomerProfile {
  const addresses = Array.isArray(row.addresses) ? row.addresses : [];
  return {
    id: text(row.id),
    email: nullableText(row.email),
    fullName: nullableText(row.full_name),
    phone: nullableText(row.phone),
    locale: text(row.locale) || "sl-SI",
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
    addresses: addresses.map((value) => {
      const source = record(value);
      return {
        id: text(source.id),
        label: nullableText(source.label),
        defaultShipping: Boolean(source.is_default_shipping),
        defaultBilling: Boolean(source.is_default_billing),
        ...address(source),
      };
    }),
  };
}

export async function getAdminCommerceData(): Promise<AdminCommerceData> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      source: "preview",
      orders: previewOrders,
      profiles: previewCustomerProfiles,
    };
  }

  const [ordersResult, profilesResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id,reference,profile_id,status,email,phone,currency,subtotal_cents,discount_cents,shipping_cents,tax_cents,total_cents,billing_address_snapshot,shipping_address_snapshot,customer_note,internal_note,checkout_mode,placed_at,created_at,updated_at,cancelled_at,completed_at,order_items(id,product_name,variant_name,sku,quantity,unit_price_cents,tax_cents,line_total_cents),payments(provider,provider_reference,status,amount_cents,refunded_cents,paid_at,created_at),shipments(status,carrier,service,tracking_number,tracking_url,shipped_at,delivered_at,created_at)")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id,email,full_name,phone,locale,created_at,updated_at,addresses(id,label,first_name,last_name,company,address_line_1,address_line_2,postal_code,city,country_code,is_default_shipping,is_default_billing)")
      .order("created_at", { ascending: false }),
  ]);

  if (ordersResult.error || !ordersResult.data) {
    return { source: "unavailable", orders: [], profiles: [] };
  }
  return {
    source: "live",
    orders: (ordersResult.data as UnknownRecord[]).map(mapOrder),
    profiles: profilesResult.error || !profilesResult.data
      ? []
      : (profilesResult.data as UnknownRecord[]).map(mapProfile),
  };
}
