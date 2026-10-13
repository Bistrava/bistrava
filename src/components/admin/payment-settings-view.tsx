'use client';

import { useActionState, useState } from 'react';
import { Landmark } from 'lucide-react';
import { saveAdminPaymentSettings } from '@/actions/admin-payments';
import { useAdminLanguage } from './admin-i18n';
import { bankTransferSchema } from '@/lib/payments/bank-transfer';
import type { PaymentSettings, PaymentSettingsState } from '@/lib/payments/settings';
import { BankTransferInstructions } from '@/components/checkout/bank-transfer-instructions';
import './payment-settings.css';

const emptyState: PaymentSettingsState = { status: 'idle', message: '' };
export function PaymentSettingsView({ initial, connected, orderingOpen }: { initial: PaymentSettings; connected: boolean; orderingOpen: boolean }) {
  const { locale } = useAdminLanguage();
  const fr = locale === 'fr';
  const [bank, setBank] = useState(initial.bank);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [state, action, pending] = useActionState(saveAdminPaymentSettings, emptyState);
  const preview = bankTransferSchema.safeParse(bank);
  const fields = [
    ['beneficiary', fr ? 'Nom du bénéficiaire' : 'Ime prejemnika', 160],
    ['iban', 'IBAN', 42],
    ['bankName', fr ? 'Nom de la banque' : 'Ime banke', 160],
    ['bic', fr ? 'BIC / SWIFT (facultatif)' : 'BIC / SWIFT (neobvezno)', 11],
  ] as const;
  return <>
    <header className="admin-page-heading"><div><p className="section-kicker">Bistrava · EUR</p><h1>{fr ? 'Paiements' : 'Plačila'}</h1><p>{fr ? 'Configurez les moyens de paiement proposés à vos clients.' : 'Nastavite načine plačila za svoje kupce.'}</p></div></header>
    {!connected ? <p role="alert">{fr ? 'Impossible de charger les réglages. Actualisez la page.' : 'Nastavitev ni mogoče naložiti. Osvežite stran.'}</p> : null}
    <div className="payment-settings-grid">
      <form action={action} className="admin-dashboard-panel card payment-settings-form">
        <h2><Landmark aria-hidden="true" size={23} /> {fr ? 'Virement bancaire' : 'Bančno nakazilo'}</h2>
        <p>{fr ? 'Ces coordonnées seront affichées au checkout, sur la confirmation de commande et dans l’e-mail au client.' : 'Ti podatki bodo prikazani na blagajni, na potrditvi naročila in v e-pošti kupcu.'}</p>
        <fieldset disabled={pending || !connected}>
          <label className="payment-settings-switch"><input name="enabled" type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /><span>{fr ? 'Proposer le virement bancaire au checkout' : 'Ponudi bančno nakazilo na blagajni'}</span></label>
          <input type="hidden" name="revision" value={state.revision ?? initial.revision} />
          {fields.map(([key, label, max]) => <div className="form-field" key={key}>
            <label htmlFor={`payment-${key}`}>{label}</label>
            <input id={`payment-${key}`} name={key} value={bank[key]} maxLength={max} required={enabled && key !== 'bic'}
              spellCheck={false} autoComplete="off" aria-invalid={Boolean(state.fieldErrors?.[key])}
              aria-describedby={state.fieldErrors?.[key] ? `error-${key}` : undefined}
              onChange={e => setBank(previous => ({ ...previous, [key]: e.target.value }))} />
            {state.fieldErrors?.[key] ? <small className="field-error" id={`error-${key}`}>{fr ? 'Vérifiez ce champ (IBAN et BIC doivent être valides).' : 'Preverite polje (IBAN in BIC morata biti veljavna).'}</small> : null}
          </div>)}
          <p className="ops-meta">{fr ? 'Devise : EUR. Indiquez le nom exact du titulaire du compte.' : 'Valuta: EUR. Vnesite točno ime imetnika računa.'}</p>
          <button type="submit" className="button button-primary">{pending ? (fr ? 'Enregistrement…' : 'Shranjevanje…') : (fr ? 'Enregistrer les réglages' : 'Shrani nastavitve')}</button>
        </fieldset>
        <p role="status" className={state.status === 'error' ? 'form-status form-status-error' : 'form-status'}>{state.message}</p>
        <p className="ops-meta">{fr ? 'Les modifications prennent effet après enregistrement. Les commandes existantes conservent leurs coordonnées d’origine. La réception des fonds reste à confirmer manuellement dans la commande.' : 'Spremembe začnejo veljati po shranjevanju. Obstoječa naročila ohranijo prvotne podatke. Prejem plačila ročno potrdite v naročilu.'}</p>
      </form>
      <aside className="admin-dashboard-panel card payment-settings-preview">
        <h2>{fr ? 'Aperçu pour le client' : 'Predogled za kupca'}</h2>
        <p>{fr ? 'Présentation en slovène. Cet aperçu suit votre saisie ; pensez à enregistrer.' : 'Predogled sledi vnosu. Spremembe shranite.'}</p>
        {preview.success ? <BankTransferInstructions bank={preview.data} /> : <p className="payment-settings-empty">{fr ? 'Renseignez le bénéficiaire, un IBAN valide et la banque pour afficher l’aperçu.' : 'Za predogled vnesite prejemnika, veljaven IBAN in banko.'}</p>}
        <p>{orderingOpen ? (fr ? 'La prise de commandes est ouverte. Le virement sera proposé si vous l’activez et enregistrez des coordonnées valides.' : 'Oddaja naročil je odprta. Nakazilo je na voljo, ko ga omogočite in shranite veljavne podatke.') : (fr ? 'La prise de commandes de la boutique est encore fermée. Vous pouvez préparer et afficher le moyen de paiement ; son activation ici ne rouvre pas les commandes.' : 'Oddaja naročil v trgovini je še zaprta. Način plačila lahko pripravite in prikažete; njegova aktivacija tukaj ne odpre oddaje naročil.')}</p>
        <p className="ops-meta">{fr ? 'Cartes bancaires et paiement à la livraison : non configurés.' : 'Kartice in plačilo po povzetju: nista nastavljena.'}</p>
      </aside>
    </div>
  </>;
}
