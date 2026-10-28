"use client";

import { useActionState } from 'react';
import { setOrderTrash } from '@/actions/admin-orders';
import { initialOrderActionState } from '@/lib/admin/order-management';
import type { AdminOrder } from '@/lib/admin/orders';
import { useAdminLanguage } from './admin-i18n';

export function OrderTrashForm({ order }: { order: AdminOrder }) {
  const { locale } = useAdminLanguage();
  const fr = locale === 'fr';
  const [state, action, pending] = useActionState(setOrderTrash, initialOrderActionState);
  const deleted = Boolean(order.deletedAt);
  return <form action={action} className="admin-order-trash card">
    <h3>{deleted ? (fr ? 'Restaurer la commande' : 'Obnovi naročilo') : (fr ? 'Supprimer la commande' : 'Izbriši naročilo')}</h3>
    <p>{fr ? 'La corbeille masque la commande dans la liste. Son historique reste conservé. Cette action ne rembourse pas, n’annule pas la commande et ne libère pas le stock réservé. Vous pouvez la restaurer à tout moment.' : 'Koš skrije naročilo s seznama in ohrani zgodovino. To dejanje ne vrne plačila, ne prekliče naročila in ne sprosti rezervirane zaloge. Naročilo lahko kadarkoli obnovite.'}</p>
    <input type="hidden" name="adminLocale" value={locale}/>
    <input type="hidden" name="orderId" value={order.id}/>
    <input type="hidden" name="expectedUpdatedAt" value={order.updatedAt}/>
    <input type="hidden" name="deleted" value={deleted ? 'no' : 'yes'}/>
    <label className="admin-order-check"><input type="checkbox" name="confirmed" required disabled={pending}/><span>{fr ? `Je confirme pour la commande ${order.reference}.` : `Potrjujem za naročilo ${order.reference}.`}</span></label>
    <p role="status">{state.message}</p>
    <button className="button button-secondary" disabled={pending}>{pending ? '…' : deleted ? (fr ? 'Restaurer' : 'Obnovi') : (fr ? 'Déplacer dans la corbeille' : 'Premakni v koš')}</button>
  </form>;
}
