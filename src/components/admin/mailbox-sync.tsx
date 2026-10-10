'use client';

import { useEffect } from 'react';

// No persistent IMAP sockets in serverless functions. While a staff workspace is
// visible, poll LWS every minute; the DB lease deduplicates tabs and instances.
export function MailboxSync({ enabled }: { enabled:boolean }) {
  useEffect(() => {
    if (!enabled) return;
    let running = false;
    let disposed = false;
    const sync = async () => {
      if (disposed || running || !navigator.onLine || document.visibilityState !== 'visible') return;
      running = true;
      try {
        const response = await fetch('/admin/mailbox',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sync'})});
        const result = await response.json();
        if (!disposed) window.dispatchEvent(new CustomEvent('bistrava-mailbox-sync',{detail:result}));
      } catch {
        if (!disposed) window.dispatchEvent(new CustomEvent('bistrava-mailbox-sync',{detail:{ok:false}}));
      } finally { running=false; }
    };
    const first = window.setTimeout(() => { void sync(); },500);
    const timer = window.setInterval(() => { void sync(); },60000);
    const visible = () => { void sync(); };
    document.addEventListener('visibilitychange',visible);
    return () => { disposed=true; clearTimeout(first); clearInterval(timer); document.removeEventListener('visibilitychange',visible); };
  },[enabled]);
  return null;
}
