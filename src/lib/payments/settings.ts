import { z } from 'zod';
import { bankTransferSchema, validIban } from './bank-transfer';

export const paymentSettingsSchema = z.object({
  revision: z.coerce.number().int().nonnegative(),
  enabled: z.boolean(),
  beneficiary: z.string().trim().max(160).refine(v => !/[\x00-\x1f]/.test(v)),
  bankName: z.string().trim().max(160).refine(v => !/[\x00-\x1f]/.test(v)),
  iban: z.string().transform(v => v.replace(/\s/g, '').toUpperCase()).refine(v => !v || validIban(v)),
  bic: z.string().trim().toUpperCase().regex(/^([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)?$/),
}).superRefine((value, context) => {
  if (!value.enabled) return;
  const bank = bankTransferSchema.safeParse(value);
  if (!bank.success) for (const issue of bank.error.issues) context.addIssue({ code: 'custom', path: issue.path, message: 'Vérifiez ce champ. / Preverite to polje.' });
});
export type PaymentSettings = {
  revision: number; enabled: boolean; configured: boolean;
  bank: { beneficiary: string; iban: string; bankName: string; bic: string; currency: 'EUR' };
};
export type PaymentSettingsState = {
  status: 'idle' | 'success' | 'error'; message: string; revision?: number;
  fieldErrors?: Record<string, string[] | undefined>;
};
