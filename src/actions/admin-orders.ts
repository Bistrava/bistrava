"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { sendOrderConfirmation, sendOrderStatusEmail } from "@/lib/email/send";
import { paymentLinkUrl } from "@/lib/payments/payment-link";
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

// Informs the customer of a new status; returns whether the e-mail was accepted for delivery
// (null when the status sends nothing). "awaiting_payment" sends the payment details.
async function notifyOrderStatus(supabase: SessionClient, orderId: string, status: string, idempotencyKey = `order-status:${orderId}:${status}`) {
  if (!isNotifiedOrderStatus(status)) return null;
  const { data: order } = await supabase
    .from("orders")
    .select("reference,email,checkout_mode,bank_transfer_snapshot,shipping_address_snapshot,total_cents,order_items(product_name,quantity,line_total_cents),shipments(carrier,tracking_number,tracking_url,created_at)")
    .eq("id", orderId)
    .single();
  if (!order || !Array.isArray(order.order_items) || order.order_items.length === 0) return false;
  if (status === "awaiting_payment" && order.checkout_mode !== "card" && !(order.checkout_mode === "bank_transfer" && order.bank_transfer_snapshot)) return null;
  const shipment = Array.isArray(order.shipments)
    ? [...order.shipments].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0]
    : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bistrava.com";
  const common = {
    customerName: [order.shipping_address_snapshot?.firstName, order.shipping_address_snapshot?.lastName].filter(Boolean).join(" ") || "stranka",
    orderReference: String(order.reference),
    orderUrl: new URL(`/narocilo/${order.reference}`, siteUrl).toString(),
    totalCents: Number(order.total_cents),
    items: order.order_items.map((item) => ({ name: String(item.product_name), quantity: Number(item.quantity), lineTotalCents: Number(item.line_total_cents) })),
  };
  if (status === "awaiting_payment" && order.checkout_mode === "bank_transfer") {
    // Bank orders: the same branded bank-instructions e-mail as at checkout.
    const sent = await sendOrderConfirmation({ to: String(order.email), idempotencyKey, data: { ...common, bankTransfer: order.bank_transfer_snapshot } })
      .catch(() => ({ ok: false as const }));
    return sent.ok;
  }
  const paymentUrl = status === "awaiting_payment" ? paymentLinkUrl(orderId, String(order.reference)) : null;
  if (status === "awaiting_payment" && !paymentUrl) return false;
  const sent = await sendOrderStatusEmail({
    to: String(order.email),
    idempotencyKey,
    data: {
      ...common,
      status,
      paymentUrl,
      shipment: shipment?.carrier && shipment.tracking_number
        ? { carrier: String(shipment.carrier), trackingNumber: String(shipment.tracking_number), trackingUrl: shipment.tracking_url ? String(shipment.tracking_url) : null }
        : null,
    },
  }).catch(() => ({ ok: false as const }));
  return sent.ok;
}

function invalidateCommerce() {
  for (const path of ["/admin", "/admin/narocila", "/admin/stranke", "/admin/dostava", "/admin/zaloga", "/admin/izdelki", "/kosarica", "/blagajna", "/dostava", "/splosni-pogoji-poslovanja", "/mehcalci-vode", "/"]) revalidatePath(path);
  revalidatePath("/izdelki/[slug]", "page");
}

export async function setOrderTrash(_previous: AdminOrderActionState, form: FormData): Promise<AdminOrderActionState> {
  const supabase = await adminClient();
  if (!supabase) return result(form, 'error', 'Session administrateur requise.', 'Potrebna je skrbniška seja.');
  const parsed = z.object({ orderId: z.uuid(), expectedUpdatedAt: z.string().datetime({ offset: true }),
    deleted: z.enum(['yes', 'no']), confirmed: z.literal('on'),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return result(form, 'error', 'Confirmez votre choix.', 'Potrdite svojo izbiro.');
  const { error } = await supabase.rpc('admin_set_order_deleted', {
    input_order_id: parsed.data.orderId, input_expected_updated_at: parsed.data.expectedUpdatedAt,
    input_deleted: parsed.data.deleted === 'yes',
  });
  if (error) return result(form, 'error', 'Action impossible. La commande a peut-être changé : actualisez puis réessayez.', 'Dejanje ni uspelo. Naročilo se je morda spremenilo: osvežite stran in poskusite znova.');
  invalidateCommerce();
  return result(form, 'success', parsed.data.deleted === 'yes' ? 'Commande déplacée dans la corbeille.' : 'Commande restaurée.', parsed.data.deleted === 'yes' ? 'Naročilo je premaknjeno v koš.' : 'Naročilo je obnovljeno.');
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

/** Resends the payment details (bank instructions or card payment link) for an order awaiting payment. */
export async function resendPaymentInformation(_previous: AdminOrderActionState, form: FormData): Promise<AdminOrderActionState> {
  const supabase = await adminClient();
  if (!supabase) return result(form, "error", "Cette action nécessite une session administrateur valide.", "Za to dejanje potrebujete veljavno skrbniško sejo.");
  const orderId = String(form.get("orderId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return result(form, "error", "Commande introuvable.", "Naročila ni mogoče najti.");
  const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
  if (order?.status !== "awaiting_payment") return result(form, "error", "Les informations de paiement s’envoient uniquement pour une commande en attente de paiement.", "Podatke za plačilo lahko pošljete samo za naročilo, ki čaka na plačilo.");
  const sent = await notifyOrderStatus(supabase, orderId, "awaiting_payment", `payment-info:${orderId}:${Date.now()}`);
  if (sent === null) return result(form, "error", "Cette commande n’a ni virement bancaire ni paiement par carte à envoyer.", "To naročilo nima bančnega nakazila ali plačila s kartico za pošiljanje.");
  return sent
    ? result(form, "success", "Informations de paiement envoyées au client.", "Podatki za plačilo so poslani stranki.")
    : result(form, "error", "L’e-mail n’a pas pu être envoyé. Vérifiez la messagerie puis réessayez.", "E-sporočila ni bilo mogoče poslati. Preverite e-poštni predal in poskusite znova.");
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
