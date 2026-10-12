import "server-only";
import { bankTransferSchema } from '@/lib/payments/bank-transfer';

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

export function getCheckoutConfig() {
  const mode = process.env.CHECKOUT_MODE;
  const bankTransfer=getBankTransferDetails();
  const validMode=mode==='manual_review'||mode==='bank_transfer';
  return {
    enabled: process.env.CHECKOUT_ORDERING_ENABLED === "true" && validMode && (mode!=='bank_transfer'||Boolean(bankTransfer)),
    mode: validMode ? (mode satisfies CheckoutMode) : null,
    bankTransfer:mode==='bank_transfer'?bankTransfer:null,
  };
}
