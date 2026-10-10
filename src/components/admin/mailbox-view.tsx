'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mail, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { useAdminLanguage } from './admin-i18n';
import { AdminNotificationsSeen, useAdminNotifications } from './admin-notifications';
import type { MailboxMessage, MailboxDetail, MailboxState } from '@/lib/email/mailbox-types';
import './mailbox.css';

export function MailboxView({ initialId }: { initialId?:string }) {
  const { locale } = useAdminLanguage(); const fr = locale === 'fr';
  const [messages,setMessages] = useState<MailboxMessage[]>([]);
  const [state,setState] = useState<MailboxState|null>(null);
  const [selected,setSelected] = useState<string|undefined>(initialId);
  const [detail,setDetail] = useState<MailboxDetail|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(false);
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const [draft,setDraft] = useState('');
  const [search,setSearch] = useState('');
  const [requestId,setRequestId] = useState('');
  const [sending,setSending] = useState(false);
  const selectedRef = useRef(selected);
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current=draft; },[draft]);
  const detailRequest = useRef(0);
  const { refresh } = useAdminNotifications();
  const date = (value:string) => new Date(value).toLocaleString(fr?'fr-FR':'sl-SI',{timeZone:'Europe/Ljubljana'});

  const load = useCallback(async () => {
    try {
      const response = await fetch('/admin/mailbox',{cache:'no-store'});
      if (!response.ok) throw new Error();
      const result = await response.json();
      setMessages(result.messages); setState(result.state); setError(false);
    } catch { setError(true); } finally { setLoading(false); }
  },[]);
  const loadDetail = useCallback(async (id:string) => {
    const request = ++detailRequest.current;
    try {
      const response = await fetch(`/admin/mailbox?id=${encodeURIComponent(id)}`,{cache:'no-store'});
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (request===detailRequest.current && selectedRef.current===id) { setDetail(result); setError(false); }
    } catch { if (request===detailRequest.current) setError(true); }
  },[]);
  useEffect(() => {
    const start = setTimeout(() => { void load(); },0);
    const update = () => { void load(); };
    window.addEventListener('bistrava-mailbox-sync',update);
    const interval = setInterval(() => { if(document.visibilityState==='visible') void load(); },30000);
    return () => { clearTimeout(start); clearInterval(interval); window.removeEventListener('bistrava-mailbox-sync',update); };
  },[load]);
  useEffect(() => {
    if (initialId && !draftRef.current) { selectedRef.current=initialId; const timer=setTimeout(() => { setSelected(initialId); setDetail(null); },0); return () => clearTimeout(timer); }
  },[initialId]);
  useEffect(() => {
    selectedRef.current=selected;
    if (selected) { const timer=setTimeout(() => { void loadDetail(selected); },0); return () => clearTimeout(timer); }
  },[selected,loadDetail]);
  const select = (id:string) => {
    if (draft && id !== selected && !window.confirm(fr?'Abandonner cette réponse non envoyée ?':'Zavržem neposlani odgovor?')) return;
    if(sending) return;
    selectedRef.current=id; setSelected(id); setDetail(null); setDraft(''); setRequestId(crypto.randomUUID()); setNotice('');
  };
  const action = async (kind:'sync'|'verify') => {
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/admin/mailbox',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:kind})});
      const result = await response.json();
      setNotice(result.ok ? (kind==='verify' ? (fr?'Connexion SMTP vérifiée, sans envoi de message.':'Povezava SMTP je preverjena, brez pošiljanja.') : result.busy ? (fr?'Synchronisation déjà en cours ou effectuée récemment.':'Sinhronizacija je že v teku ali je bila pravkar izvedena.') : (fr?'Boîte synchronisée.':'Predal je sinhroniziran.')) : (fr?'Connexion indisponible. Vérifiez la configuration LWS.':'Povezava ni na voljo. Preverite nastavitve LWS.'));
      await load(); refresh();
    } catch { setNotice(fr?'La connexion a échoué.':'Povezava ni uspela.'); }
    finally { setBusy(false); }
  };
  const send = async () => {
    if (!detail || sending || !draft.trim()) return;
    setSending(true); setNotice('');
    const id = requestId || crypto.randomUUID(); setRequestId(id);
    try {
      const response = await fetch('/admin/mailbox',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reply',reply:{id,messageId:detail.id,body:draft}})});
      const result = await response.json();
      if (result.ok) { setDraft(''); setRequestId(crypto.randomUUID()); setNotice(fr?'Réponse acceptée par le serveur LWS.':'Strežnik LWS je sprejel odgovor.'); }
      else setNotice(fr?'Envoi non confirmé. Consultez l’historique avant toute nouvelle tentative.':'Pošiljanje ni potrjeno. Pred novim poskusom preverite zgodovino.');
      await loadDetail(detail.id);
    } catch { setNotice(fr?'Résultat de l’envoi inconnu. Vérifiez l’historique avant de réessayer.':'Izid pošiljanja ni znan. Pred ponovitvijo preverite zgodovino.'); await loadDetail(detail.id); }
    finally { setSending(false); }
  };
  const pending = detail?.replies.some(r => r.status==='sending' || r.status==='unknown');
  const visible = messages.filter(m => `${m.subject} ${m.sender_name} ${m.sender_address}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="mailbox-root">
    <header className="admin-page-heading"><div><p className="section-kicker">kontakt@bistrava.com</p><h1>{fr?'Boîte de réception':'Prejeta pošta'}</h1><p>{fr?'Lisez les e-mails et répondez aux clients depuis Bistrava.':'Preberite e-pošto in odgovorite kupcem neposredno v Bistravi.'}</p></div><Mail size={30} aria-hidden="true"/></header>
    <div className="mailbox-status"><div><strong>{state?.last_success_at ? (fr?'Boîte LWS connectée':'Predal LWS je povezan') : (fr?'Connexion à la boîte LWS':'Povezovanje s predalom LWS')}</strong><p>{state?.last_success_at ? `${fr?'Dernière synchronisation':'Zadnja sinhronizacija'} : ${date(state.last_success_at)}` : (fr?'La première synchronisation est en cours.':'Prva sinhronizacija je v teku.')}</p><small>{fr?'Synchronisation chaque minute tant que l’administration est ouverte.':'Sinhronizacija vsako minuto, ko je administracija odprta.'}</small></div><div className="mailbox-tools"><button className="button button-secondary" disabled={busy} onClick={()=>void action('sync')}><RefreshCw size={16}/>{fr?'Synchroniser':'Sinhroniziraj'}</button><button className="button button-secondary" disabled={busy} onClick={()=>void action('verify')}><ShieldCheck size={16}/>{fr?'Vérifier SMTP':'Preveri SMTP'}</button></div></div>
    {error || state?.last_error ? <p role="alert" className="ops-notice">{fr?'Actualisation indisponible. Les derniers messages enregistrés restent affichés.':'Osveževanje ni na voljo. Prikazana so zadnja shranjena sporočila.'}</p>:null}
    {notice ? <p role="status" className="ops-notice">{notice}</p>:null}
    <div className="mailbox-columns"><aside className="mailbox-list"><label>{fr?'Rechercher dans les 100 derniers e-mails':'Poišči med zadnjimi 100 sporočili'}<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={fr?'Nom, adresse ou objet…':'Ime, naslov ali zadeva…'}/></label><div>{visible.map(m=><button key={m.id} className={selected===m.id?'is-selected':''} onClick={()=>select(m.id)} disabled={sending}><strong>{m.sender_name||m.sender_address|| (fr?'Expéditeur inconnu':'Neznani pošiljatelj')}</strong><span>{m.subject}</span><time>{date(m.received_at)}</time></button>)}</div>{!visible.length ? <p className="mailbox-empty">{loading ? (fr?'Chargement…':'Nalaganje…') : fr?'Aucun e-mail à afficher.':'Ni sporočil za prikaz.'}</p>:null}</aside>
    <article className="mailbox-detail" id={detail?`email-${detail.id}`:undefined}>
      {!detail ? <div className="mailbox-empty"><Mail size={36}/><h2>{fr?'Sélectionnez un e-mail':'Izberite sporočilo'}</h2><p>{fr?'Son contenu et vos réponses apparaîtront ici.':'Tukaj se prikažejo vsebina in vaši odgovori.'}</p></div>:<>
      <AdminNotificationsSeen category="email" entityIds={[detail.id]}/><header><h2>{detail.subject}</h2><p><strong>{detail.sender_name}</strong> &lt;{detail.sender_address}&gt;</p><time>{date(detail.received_at)}</time></header>
      <div className="mailbox-body">{detail.body_text || (fr?'Ce message ne contient pas de texte affichable.':'To sporočilo nima besedila za prikaz.')}</div>
      {detail.body_limited || detail.attachments.length ? <div className="ops-notice">{fr?'Pour les pièces jointes ou le contenu complet des messages volumineux, utilisez votre webmail LWS.':'Za priponke ali celotno vsebino velikih sporočil uporabite spletno pošto LWS.'}{detail.attachments.map((a,i)=><p key={i}>{a.name} · {Math.ceil(a.size/1024)} Ko</p>)}</div>:null}
      {detail.replies.length ? <section className="mailbox-history"><h3>{fr?'Réponses depuis Bistrava':'Odgovori iz Bistrave'}</h3>{detail.replies.map(r=><div key={r.id}><strong>{r.status==='sent' ? (fr?'Envoyé':'Poslano') : r.status==='failed' ? (fr?'Échec':'Neuspešno') : (fr?'Envoi à vérifier — ne pas renvoyer':'Preverite pošiljanje — ne pošljite znova')}</strong><time>{date(r.created_at)}</time><p>{r.body_text}</p></div>)}</section>:null}
      <form className="mailbox-reply" onSubmit={e=>{e.preventDefault();void send();}}><h3>{fr?'Répondre':'Odgovori'}</h3><p>{fr?'Destinataire':'Prejemnik'} : <strong>{detail.reply_address||detail.sender_address}</strong></p><label htmlFor="mailbox-answer">{fr?'Votre réponse':'Vaš odgovor'}</label><textarea id="mailbox-answer" rows={7} maxLength={20000} value={draft} disabled={sending||pending} onChange={e=>setDraft(e.target.value)} required/><p><small>{fr?'Les réponses sont conservées dans cet historique Bistrava.':'Odgovori so shranjeni v tej zgodovini Bistrave.'}</small></p><button className="button button-primary" disabled={sending||pending||!draft.trim()||!(detail.reply_address||detail.sender_address)}><Send size={16}/>{sending ? (fr?'Envoi…':'Pošiljanje…') : (fr?'Envoyer la réponse':'Pošlji odgovor')}</button></form>
      </>}
    </article></div>
  </section>;
}
