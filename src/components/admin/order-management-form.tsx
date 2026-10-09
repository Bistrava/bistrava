"use client";

import { useActionState, useState } from "react";
import { Save, Truck } from "lucide-react";
import { saveAdminOrder } from "@/actions/admin-orders";
import { useAdminLanguage } from "@/components/admin/admin-i18n";
import { availableOrderStatuses, initialOrderActionState, shipmentStatusesForOrder } from "@/lib/admin/order-management";
import type { AdminOrder, AdminOrderStatus } from "@/lib/admin/orders";

export function OrderManagementForm({ order, statusLabel, shipmentStatusLabel }: {
  order: AdminOrder;
  statusLabel: (status: AdminOrderStatus) => string;
  shipmentStatusLabel: (status: string) => string;
}) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [state, action, pending] = useActionState(saveAdminOrder, initialOrderActionState);
  const [status, setStatus] = useState(order.status);
  const [shipmentStatus, setShipmentStatus] = useState(order.shipment?.status ?? "pending");
  const allowedShipmentStatuses = shipmentStatusesForOrder(status);
  const editShipment = allowedShipmentStatuses.length > 0 && !["returned", "cancelled"].includes(order.shipment?.status ?? "");
  const paymentConfirmation = status === "paid" && ["pending", "awaiting_payment"].includes(order.status);

  function changeStatus(value: AdminOrderStatus) {
    setStatus(value);
    const statuses = shipmentStatusesForOrder(value);
    if (!statuses.includes(shipmentStatus)) setShipmentStatus(statuses[0] ?? "pending");
  }

  return <form action={action} className="admin-order-edit">
    <input name="adminLocale" type="hidden" value={locale} />
    <input name="orderId" type="hidden" value={order.id} />
    <input name="expectedUpdatedAt" type="hidden" value={order.updatedAt} />
    <input name="editShipment" type="hidden" value={editShipment ? "yes" : "no"} />
    <h3>{fr ? "Traiter la commande" : "Obdelava naročila"}</h3>
    <fieldset disabled={pending}>
      <label><span>{fr ? "Statut de la commande" : "Status naročila"}</span><select name="status" onChange={(event) => changeStatus(event.target.value as AdminOrderStatus)} value={status}>
        {availableOrderStatuses(order).map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
      </select></label>
      {paymentConfirmation ? <div className="admin-order-confirmation">
        <p>{fr ? "Confirmez le paiement uniquement après avoir constaté la réception des fonds. Cette action enregistre un paiement manuel et ne débite pas le client." : "Plačilo potrdite šele po prejemu sredstev. To dejanje zabeleži ročno plačilo in kupca ne bremeni."}</p>
        <label><span>{fr ? "Référence du paiement reçu" : "Referenca prejetega plačila"}</span><input maxLength={200} minLength={3} name="paymentReference" required /></label>
        <label className="admin-order-check"><input name="paymentReceived" required type="checkbox" /><span>{fr ? "J’ai vérifié la réception du montant total." : "Preveril/-a sem prejem celotnega zneska."}</span></label>
      </div> : <input name="paymentReference" type="hidden" value="" />}
      {status === "cancelled" && order.status !== "cancelled" ? <p className="admin-order-confirmation">{fr ? "L’annulation libère les quantités réservées et annule le paiement en attente. Elle ne rembourse aucun paiement." : "Preklic sprosti rezervirano zalogo in prekliče čakajoče plačilo. Nobeno plačilo ne bo povrnjeno."}</p> : null}
      <label><span>{fr ? "Note interne" : "Interna opomba"}</span><textarea defaultValue={order.internalNote ?? ""} maxLength={5000} name="internalNote" rows={3} /><small>{fr ? "Visible uniquement dans l’administration." : "Vidno samo v administraciji."}</small></label>
      {editShipment ? <>
        <h4><Truck size={17} aria-hidden="true" />{fr ? "Colis et suivi" : "Pošiljka in sledenje"}</h4>
        <div className="admin-order-form-grid">
          <label><span>{fr ? "État du colis" : "Status pošiljke"}</span><select name="shipmentStatus" value={shipmentStatus} onChange={(event) => setShipmentStatus(event.target.value)}>
            {allowedShipmentStatuses.filter((value) => order.shipment?.status !== "in_transit" || value !== "shipped").map((value) => <option key={value} value={value}>{shipmentStatusLabel(value)}</option>)}
          </select></label>
          <label><span>{fr ? "Transporteur" : "Prevoznik"}</span><input defaultValue={order.shipment?.carrier ?? ""} maxLength={120} name="carrier" required={["shipped", "completed"].includes(status)} placeholder="Pošta Slovenije, GLS, DPD…" /></label>
          <label><span>{fr ? "Service" : "Storitev"}</span><input defaultValue={order.shipment?.service ?? ""} maxLength={120} name="service" /></label>
          <label><span>{fr ? "Numéro de suivi" : "Številka za sledenje"}</span><input defaultValue={order.shipment?.trackingNumber ?? ""} maxLength={200} name="trackingNumber" required={["shipped", "completed"].includes(status)} /></label>
          <label className="admin-order-form-wide"><span>{fr ? "Lien de suivi (HTTPS)" : "Povezava za sledenje (HTTPS)"}</span><input defaultValue={order.shipment?.trackingUrl ?? ""} maxLength={1000} name="trackingUrl" pattern="https://.*" placeholder="https://…" type="url" /></label>
        </div>
      </> : <>{["shipmentStatus", "carrier", "service", "trackingNumber", "trackingUrl"].map((name) => <input key={name} name={name} type="hidden" value={name === "shipmentStatus" ? "pending" : ""} />)}</>}
      <button className="button button-primary" disabled={pending} type="submit"><Save size={17} aria-hidden="true" />{pending ? fr ? "Enregistrement…" : "Shranjevanje…" : fr ? "Enregistrer la commande" : "Shrani naročilo"}</button>
    </fieldset>
    {state.message ? <p aria-live="polite" className={`admin-operation-message is-${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
  </form>;
}
