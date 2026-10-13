'use server';

import { revalidatePath } from 'next/cache';
import { getAdminAccess } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { paymentSettingsSchema, type PaymentSettingsState } from '@/lib/payments/settings';

export async function saveAdminPaymentSettings(_state: PaymentSettingsState, form: FormData): Promise<PaymentSettingsState> {
  const access = await getAdminAccess();
  if (access.status !== 'authorized' || access.role !== 'admin') return { status: 'error', message: 'Réservé aux administrateurs. / Samo za administratorje.' };
  const parsed = paymentSettingsSchema.safeParse({ ...Object.fromEntries(form), enabled: form.get('enabled') === 'on' });
  if (!parsed.success) return { status: 'error', message: 'Vérifiez les coordonnées bancaires. / Preverite bančne podatke.', fieldErrors: parsed.error.flatten().fieldErrors };
  const db = await createClient();
  if (!db) return { status: 'error', message: 'Connexion indisponible. / Povezava ni na voljo.' };
  const { revision, enabled, ...bank } = parsed.data;
  const { data, error } = await db.rpc('save_admin_payment_settings', {
    input_expected_revision: revision, input_enabled: enabled, input_bank_details: { ...bank, currency: 'EUR' },
  });
  if (error || typeof data !== 'number') return { status: 'error', message: error?.message.includes('payment_settings_conflict')
    ? 'Les réglages ont changé. Actualisez la page avant de réessayer. / Nastavitve so se spremenile. Osvežite stran.'
    : 'Enregistrement impossible. / Shranjevanje ni uspelo.' };
  for (const path of ['/admin/placila', '/admin/nastavitve', '/admin', '/admin/analitika', '/blagajna']) revalidatePath(path);
  return { status: 'success', revision: data, message: 'Réglages enregistrés. / Nastavitve so shranjene.' };
}
