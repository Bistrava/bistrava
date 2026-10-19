import { beforeEach,describe,expect,it,vi } from 'vitest';
vi.mock('server-only',()=>({}));
import { bankTransferSchema,validIban,formatIban,paymentStatusCopy } from './bank-transfer';
import { getEnvironmentCheckoutConfig as getCheckoutConfig } from '@/lib/commerce/config';
const bank={beneficiary:'EXAMPLE TEST ONLY',iban:'GB82WEST12345698765432',bankName:'Example bank',bic:'DEUTDEFF',currency:'EUR'};
beforeEach(()=>{vi.unstubAllEnvs();vi.stubEnv('CHECKOUT_MODE','bank_transfer');vi.stubEnv('CHECKOUT_ORDERING_ENABLED','true');for(const key of ['BANK_TRANSFER_BENEFICIARY','BANK_TRANSFER_IBAN','BANK_TRANSFER_BANK_NAME','BANK_TRANSFER_BIC'])vi.stubEnv(key,'');});
describe('bank transfer configuration',()=>{
  it('normalizes spaced IBANs and rejects an invalid checksum or header injection',()=>{
    expect(bankTransferSchema.parse({...bank,iban:'gb82 west 1234 5698 7654 32'}).iban).toBe(bank.iban);
    expect(validIban('GB83WEST12345698765432')).toBe(false);
    expect(bankTransferSchema.safeParse({...bank,beneficiary:'Example\nOther'}).success).toBe(false);
    expect(bankTransferSchema.safeParse({...bank,bic:'bad'}).success).toBe(false);
    expect(bankTransferSchema.safeParse({...bank,currency:'USD'}).success).toBe(false);
    expect(formatIban(bank.iban)).toBe('GB82 WEST 1234 5698 7654 32');
  });
  it('keeps checkout closed if account details are absent or invalid',()=>{
    expect(getCheckoutConfig().enabled).toBe(false);
    vi.stubEnv('BANK_TRANSFER_BENEFICIARY',bank.beneficiary);vi.stubEnv('BANK_TRANSFER_IBAN','invalid');vi.stubEnv('BANK_TRANSFER_BANK_NAME',bank.bankName);
    expect(getCheckoutConfig().enabled).toBe(false);
    vi.stubEnv('BANK_TRANSFER_IBAN',bank.iban);
    expect(getCheckoutConfig().enabled).toBe(true);
    vi.stubEnv('CHECKOUT_ORDERING_ENABLED','false');expect(getCheckoutConfig().enabled).toBe(false);
  });
  it('never represents awaiting or cancelled orders as paid',()=>{
    expect(paymentStatusCopy('awaiting_payment')).toBe('Čaka na potrdilo o nakazilu');
    expect(paymentStatusCopy('awaiting_payment', true)).toBe('Naročilo dokončno potrjeno');
    expect(paymentStatusCopy('pending', true)).toBe('Naročilo dokončno potrjeno');
    expect(paymentStatusCopy('cancelled', true)).toBe('Preklicano');
    expect(paymentStatusCopy('cancelled')).toBe('Preklicano');
    expect(paymentStatusCopy('paid')).toBe('Plačilo prejeto');
  });
});
