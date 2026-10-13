import { AdminWorkspace } from '@/components/admin/admin-workspace';
import { PaymentSettingsView } from '@/components/admin/payment-settings-view';
import { getAdminPageAccess } from '@/lib/auth/admin-page';
import { createClient } from '@/lib/supabase/server';
import { getBankTransferDetails } from '@/lib/commerce/config';

export const dynamic = 'force-dynamic';
export default async function PaymentsPage() {
  const access = await getAdminPageAccess();
  if (access.mode === 'not_configured') return <p>Supabase ni povezan.</p>;
  if (access.mode !== 'authenticated' || access.role !== 'admin') return <AdminWorkspace access={access} active="payments"><p>Réservé aux administrateurs. / Samo za administratorje.</p></AdminWorkspace>;
  const db = await createClient();
  const result = await db?.from('payment_settings').select('configured,enabled,bank_details,revision').eq('id', 'bank_transfer').single();
  const row = result?.error ? null : result?.data;
  const bank = row?.configured ? row.bank_details : getBankTransferDetails();
  return <AdminWorkspace access={access} active="payments"><PaymentSettingsView
    connected={Boolean(row)} orderingOpen={process.env.CHECKOUT_ORDERING_ENABLED === 'true'}
    initial={{ revision: row?.revision ?? 0, configured: row?.configured ?? false, enabled: row?.enabled ?? false,
      bank: { beneficiary: bank?.beneficiary ?? '', iban: bank?.iban ?? '', bankName: bank?.bankName ?? '', bic: bank?.bic ?? '', currency: 'EUR' } }}
  /></AdminWorkspace>;
}
