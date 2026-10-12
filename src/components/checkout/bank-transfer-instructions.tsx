'use client';

import { useState } from 'react';
import { Copy, Landmark } from 'lucide-react';
import { formatIban,type BankTransferDetails } from '@/lib/payments/bank-transfer';
import { formatMoney } from '@/lib/commerce/money';
import './bank-transfer.css';

export function BankTransferInstructions({bank,amountCents,reference}:{bank:BankTransferDetails;amountCents?:number;reference?:string}) {
  const [notice,setNotice]=useState('');
  const copy=async(value:string)=>{try{await navigator.clipboard.writeText(value);setNotice('Kopirano.');}catch{setNotice('Kopiranje ni uspelo. Podatek označite in kopirajte ročno.');}};
  const rows=[['Prejemnik',bank.beneficiary],['IBAN',formatIban(bank.iban)],['Banka',bank.bankName],...(bank.bic?[['BIC / SWIFT',bank.bic]]:[]),['Valuta','EUR'],...(amountCents!==undefined?[['Znesek za nakazilo',formatMoney(amountCents)]]:[]),...(reference?[['Namen nakazila / referenca naročila',reference]]:[])];
  return <section className="bank-transfer-instructions" aria-label="Podatki za bančno nakazilo"><div className="bank-transfer-title"><Landmark aria-hidden="true" size={26}/><div><p className="section-kicker">Bančno nakazilo</p><h2>Podatki za plačilo</h2></div></div>
    <dl>{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd><strong>{value}</strong>{label==='IBAN'||value===reference?<button type="button" aria-label={`Kopiraj ${label}`} onClick={()=>void copy(label==='IBAN'?bank.iban:value)}><Copy size={16} aria-hidden="true"/></button>:null}</dd></div>)}</dl>
    {reference?<ol><li>V svoji spletni ali mobilni banki izberite nakazilo v EUR.</li><li>Prepišite prejemnika, IBAN in točen znesek. V namen plačila vpišite <strong>{reference}</strong>.</li><li>Potrdite nakazilo v svoji banki. Naročilo začnemo pripravljati po potrjenem prejemu plačila.</li></ol>:<p>Po oddaji naročila boste prejeli točen znesek in referenco za nakazilo. Pred oddajo naročila ne nakazujte sredstev.</p>}
    <p className="bank-transfer-copy-status" aria-live="polite">{notice}</p>
  </section>;
}
