"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email/send";
import { isNotifiedOrderStatus, orderStatusCopy } from "@/lib/email/order-status-copy";
import { orderManagementSchema, shippingRateSchema, shippingZoneSchema, transferProofSchema, type AdminOrderActionState } from "@/lib/admin/order-management";

function result(form: FormData, status: "success" | "error", fr: string, sl: string): AdminOrderActionState {
  return { status, message: form.get("adminLocale") === "fr" ? fr : sl };
}

async function adminClient() {
  const access = await getAdminAccess();
  if (access.status !== "authorized" || access.role !== "admin") return null;
  return createClient();
}

type SessionClient = NonNullable<Awaited<ReturnType<typeof adminClient>>>;

// Informs the customer of a new status; returns whether the e-mail was accepted for delivery.
async function notifyOrderStatus(supabase: SessionClient, orderId: string, status: string) {
  if (!isNotifiedOrderStatus(status)) return null;
  const { data: order } = await supabase
    .from("orders")
    .select("reference,email,shipping_address_snapshot,total_cents,order_items(product_name,quantity,line_total_cents),shipments(carrier,tracking_number,tracking_url,created_at)")
    .eq("id", orderId)
    .single();
  if (!order || !Array.isArray(order.order_items) || order.order_items.length === 0) return false;
  const shipment = Array.isArray(order.shipments)
    ? [...order.shipments].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0]
    : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bistrava.com";
  const sent = await sendOrderStatusEmail({
    to: String(order.email),
    idempotencyKey: `order-status:${orderId}:${status}`,
    data: {
      customerName: [order.shipping_address_snapshot?.firstName, order.shipping_address_snapshot?.lastName].filter(Boolean).join(" ") || "stranka",
      orderReference: String(order.reference),
      orderUrl: new URL(`/narocilo/${order.reference}`, siteUrl).toString(),
      totalCents: Number(order.total_cents),
      status,
      shipment: shipment?.carrier && shipment.tracking_number
        ? { carrier: String(shipment.carrier), trackingNumber: String(shipment.tracking_number), trackingUrl: shipment.tracking_url ? String(shipment.tracking_url) : null }
        : null,
      items: order.order_items.map((item) => ({ name: String(item.product_name), quantity: Number(item.quantity), lineTotalCents: Number(item.line_total_cents) })),
    },
  }).catch(() => ({ ok: false as const }));
  return sent.ok;
}

function invalidateCommerce() {
  for (const path of ["/admin", "/admin/narocila", "/admin/stranke", "/admin/dostava", "/admin/zaloga", "/admin/izdelki", "/kosarica", "/blagajna", "/dostava", "/splosni-pogoji-poslovanja", "/mehcalci-vode", "/"]) revalidatePath(path);
  revalidatePath("/izdelki/[slug]", "page");
}

export async function saveAdminOrder(_previous: AdminOrderActionState, form: FormData): Promise<AdminOrderActionState> {
  const supabase = await adminClient();
  if (!supabase) return result(form, "error", "Cette action nécessite une session administrateur valide.", "Za to dejanje potrebujete veljavno skrbniško sejo.");
  const parsed = orderManagementSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return result(form, "error", "Vérifiez le statut, le transporteur, le numéro de suivi et les champs du formulaire.", "Preverite status, prevoznika, številko za sledenje in polja obrazca.");
  const value = parsed.data;
  const { data: before } = await supabase.from("orders").select("status").eq("id", value.orderId).maybeSingle();
  const { error } = await supabase.rpc("admin_save_order", {
    input_order_id: value.orderId,
    input_expected_updated_at: value.expectedUpdatedAt,
    input_status: value.status,
    input_internal_note: value.internalNote,
    input_shipment: value.editShipment === "yes" && value.status !== "cancelled" ? {
      status: value.shipmentStatus, carrier: value.carrier, service: value.service,
      trackingNumber: value.trackingNumber, trackingUrl: value.trackingUrl,
    } : null,
    input_payment_reference: value.paymentReference || null,
  });
  if (error) {
    if (error.message.includes("order_conflict")) return result(form, "error", "La commande a été modifiée entre-temps. Actualisez la page puis recommencez.", "Naročilo se je medtem spremenilo. Osvežite stran in poskusite znova.");
    if (error.message.includes("payment_confirmation_required")) return result(form, "error", "Confirmez uniquement un paiement manuel reçu, avec sa référence.", "Potrdite le prejeto ročno plačilo z njegovo referenco.");
    if (error.message.includes("paid_order_required")) return result(form, "error", "Le paiement complet doit être confirmé avant de préparer ou expédier la commande.", "Pred pripravo ali odpremo naročila mora biti celotno plačilo potrjeno.");
    if (error.message.includes("tracking_required")) return result(form, "error", "Renseignez le transporteur et le numéro de suivi avant l’expédition.", "Pred odpremo vnesite prevoznika in številko za sledenje.");
    return result(form, "error", "Enregistrement impossible. Vérifiez le statut et la connexion à la base de données.", "Shranjevanje ni uspelo. Preverite status in povezavo s podatkovno bazo.");
  }
  invalidateCommerce();
  revalidatePath("/narocilo/[reference]", "page");
  // The order is saved either way; an e-mail failure is reported to staff, never rolled back.
  const emailed = before && before.status !== value.status ? await notifyOrderStatus(supabase, value.orderId, value.status) : null;
  if (emailed === null) return result(form, "success", "Commande et historique enregistrés.", "Naročilo in zgodovina sta shranjena.");
  const badge = isNotifiedOrderStatus(value.status) ? orderStatusCopy(value.status, "").badge : value.status;
  return emailed
    ? result(form, "success", `Commande et historique enregistrés. E-mail « ${badge} » envoyé au client.`, `Naročilo in zgodovina sta shranjena. E-sporočilo »${badge}« je poslano stranki.`)
    : result(form, "success", "Commande et historique enregistrés. L’e-mail au client n’a pas pu être envoyé : contactez-le directement.", "Naročilo in zgodovina sta shranjena. E-sporočila stranki ni bilo mogoče poslati; obvestite jo neposredno.");
}

export async function confirmTransferProof(_previous: AdminOrderActionState, form: FormData): Promise<AdminOrderActionState> {
  const supabase = await adminClient();
  if (!supabase) return result(form, "error", "Cette action nécessite une session administrateur valide.", "Za to dejanje potrebujete veljavno skrbniško sejo.");
  const parsed = transferProofSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return result(form, "error", "Confirmez la réception du justificatif et indiquez sa référence.", "Potrdite prejem potrdila o nakazilu in vnesite njegovo referenco.");
  const { error } = await supabase.rpc('admin_confirm_transfer_proof', {
    input_order_id: parsed.data.orderId,
    input_expected_updated_at: parsed.data.expectedUpdatedAt,
    input_proof_reference: parsed.data.proofReference,
  });
  if (error) return result(form, "error", error.message.includes('order_conflict') ? "La commande a changé. Actualisez la page puis recommencez." : "Impossible d’enregistrer la preuve de virement. Vérifiez la commande et la connexion.", error.message.includes('order_conflict') ? "Naročilo se je spremenilo. Osvežite stran in poskusite znova." : "Potrdila o nakazilu ni mogoče shraniti. Preverite naročilo in povezavo.");
  invalidateCommerce();
  revalidatePath('/narocilo/[reference]', 'page');
  return result(form, "success", "Preuve de virement reçue : la commande est finalisée. L’encaissement reste à vérifier séparément.", "Potrdilo o nakazilu je prejeto: naročilo je dokončno potrjeno. Prejem sredstev se preveri ločeno.");
}

export async function saveAdminShippingZone(_previous: AdminOrderActionState, form: FormData): Promise<AdminOrderActionState> {
  const supabase = await adminClient();
  if (!supabase) return result(form, "error", "Session administrateur requise.", "Potrebna je skrbniška seja.");
  const parsed = shippingZoneSchema.safeParse({ ...Object.fromEntries(form), active: form.has("active") ? "on" : "off" });
  if (!parsed.success) return result(form, "error", "Vérifiez le nom de la zone de livraison.", "Preverite ime območja dostave.");
  const { error } = await supabase.rpc("admin_save_shipping_zone", {
    input_id: parsed.data.id || null, input_name: parsed.data.name, input_active: parsed.data.active === "on", input_expected_updated_at: parsed.data.expectedUpdatedAt || null,
  });
  if (error) return result(form, "error", error.message.includes("shipping_conflict") ? "Cette zone a changé. Actualisez la page." : "La zone n’a pas pu être enregistrée.", error.message.includes("shipping_conflict") ? "Območje se je spremenilo. Osvežite stran." : "Območja ni bilo mogoče shraniti.");
  invalidateCommerce();
  return result(form, "success", "Zone de livraison enregistrée.", "Območje dostave je shranjeno.");
}

export async function saveAdminShippingRate(_previous: AdminOrderActionState, form: FormData): Promise<AdminOrderActionState> {
  const supabase = await adminClient();
  if (!supabase) return result(form, "error", "Session administrateur requise.", "Potrebna je skrbniška seja.");
  const parsed = shippingRateSchema.safeParse({ ...Object.fromEntries(form), active: form.has("active") ? "on" : "off" });
  if (!parsed.success) return result(form, "error", "Vérifiez la zone, le prix et les bornes du panier (minimum ≤ maximum). Renseignez les deux délais de 1 à 90 jours, ou laissez-les tous deux vides.", "Preverite območje, ceno in meji vrednosti košarice (najnižja ≤ najvišja). Vnesite oba roka od 1 do 90 dni ali pustite oba prazna.");
  const value = parsed.data;
  const { error } = await supabase.rpc("admin_save_shipping_rate", {
    input_id: value.id || null, input_zone_id: value.zoneId, input_name: value.name, input_price_cents: value.price,
    input_days_min: value.estimatedDaysMin, input_days_max: value.estimatedDaysMax, input_active: value.active === "on", input_expected_updated_at: value.expectedUpdatedAt || null,
    input_min_order_cents: value.minOrder, input_max_order_cents: value.maxOrder,
  });
  if (error) return result(form, "error", error.message.includes("shipping_conflict") ? "Ce tarif a changé. Actualisez la page." : "Le tarif n’a pas pu être enregistré.", error.message.includes("shipping_conflict") ? "Tarifa se je spremenila. Osvežite stran." : "Tarife ni bilo mogoče shraniti.");
  invalidateCommerce();
  return result(form, "success", "Tarif enregistré. Les options actives sont proposées au paiement.", "Tarifa je shranjena. Aktivne možnosti so na voljo ob zaključku nakupa.");
}
