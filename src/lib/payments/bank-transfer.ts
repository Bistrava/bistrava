import { z } from 'zod';

// ISO 13616 / MOD 97-10 checksum. This validates the identifier, not ownership.
export function validIban(value:string) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(value)) return false;
  const rearranged=value.slice(4)+value.slice(0,4);
  let remainder=0;
  for(const char of rearranged) {
    const digits=/[A-Z]/.test(char)?String(char.charCodeAt(0)-55):char;
    for(const digit of digits) remainder=(remainder*10+Number(digit))%97;
  }
  return remainder===1;
}
const cleanText=z.string().trim().min(2).max(160).refine(v=>!/[\r\n\x00-\x1f]/.test(v));
export const bankTransferSchema=z.object({
  beneficiary:cleanText,
  iban:z.string().transform(v=>v.replace(/\s/g,'').toUpperCase()).refine(validIban),
  bankName:cleanText,
  bic:z.string().trim().toUpperCase().regex(/^([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)?$/).default(''),
  currency:z.literal('EUR').default('EUR'),
});
export type BankTransferDetails=z.infer<typeof bankTransferSchema>;
export const formatIban=(iban:string)=>iban.replace(/(.{4})(?=.)/g,'$1 ');
export function paymentStatusCopy(status:string, transferProofReceived = false) {
  if (['pending', 'awaiting_payment'].includes(status) && transferProofReceived) return 'Naročilo dokončno potrjeno';
  return ({pending:'V pregledu',awaiting_payment:'Čaka na potrdilo o nakazilu',paid:'Plačilo prejeto',processing:'V pripravi',shipped:'Odpremljeno',completed:'Zaključeno',cancelled:'Preklicano',refunded:'Povrnjeno',partially_refunded:'Delno povrnjeno'} as Record<string,string>)[status] || 'V obdelavi';
}
