import "server-only";
import { bankTransferSchema } from '@/lib/payments/bank-transfer';
import { createAdminClient } from '@/lib/supabase/admin';

export type CheckoutMode = "manual_review" | "bank_transfer";

export function getBankTransferDetails() {
  const result=bankTransferSchema.safeParse({
    beneficiary:process.env.BANK_TRANSFER_BENEFICIARY,
    iban:process.env.BANK_TRANSFER_IBAN,
    bankName:process.env.BANK_TRANSFER_BANK_NAME,
    bic:process.env.BANK_TRANSFER_BIC || '', currency:'EUR',
  });
  return result.success?result.data:null;
}

export function getEnvironmentCheckoutConfig() {
  const mode = process.env.CHECKOUT_MODE;
  const bankTransfer=getBankTransferDetails();
  const validMode=mode==='manual_review'||mode==='bank_transfer';
  return {
    enabled: process.env.CHECKOUT_ORDERING_ENABLED === "true" && validMode && (mode!=='bank_transfer'||Boolean(bankTransfer)),
    mode: validMode ? (mode satisfies CheckoutMode) : null,
    bankTransfer:mode==='bank_transfer'?bankTransfer:null,
    version: 'env',
  };
}

export async function getCheckoutConfig() {
  const unavailable = { enabled: false, mode: null, bankTransfer: null, version: 'unavailable' };
  try {
    const db = createAdminClient();
    if (!db) return unavailable;
    const { data, error } = await db.from('payment_settings').select('configured,enabled,bank_details,revision').eq('id', 'bank_transfer').single();
    if (error || !data) return unavailable;
    if (!data.configured) return getEnvironmentCheckoutConfig();
    const bank = bankTransferSchema.safeParse(data.bank_details);
    return {
      enabled: process.env.CHECKOUT_ORDERING_ENABLED === 'true' && data.enabled === true && bank.success,
      mode: 'bank_transfer' as const,
      bankTransfer: data.enabled && bank.success ? bank.data : null,
      version: `db:${data.revision}`,
    };
  } catch { return unavailable; }
}
