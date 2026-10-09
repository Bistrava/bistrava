"use client";

import { Bell, ChevronRight, ClipboardList, Mail, MessageSquare, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { markAdminNotificationsRead } from "@/actions/admin-notifications";
import type { AdminNotifications, AdminNotificationCategory } from "@/lib/admin/notifications";
import { createClient } from "@/lib/supabase/client";
import { useAdminLanguage } from "./admin-i18n";
import "./admin-notifications.css";

export type { AdminNotificationCategory } from "@/lib/admin/notifications";
export type AdminNotification = AdminNotifications["items"][number];
export type AdminNotificationsData = AdminNotifications;
type Connection = "connecting" | "live" | "fallback" | "offline";
type ReadResult = { status: "success" | "error" };
type NotificationsContext = {
  data: AdminNotificationsData | null;
  loading: boolean;
  error: boolean;
  enabled: boolean;
  connection: Connection;
  refresh: () => void;
  markRead: (category: AdminNotificationCategory, entityIds: readonly string[]) => Promise<ReadResult>;
};

const categories = ["orders", "inquiries", "email"] as const;
const destinations = { orders: "/admin/narocila", inquiries: "/admin/povprasevanja", email: "/admin/e-posta" } as const;
const categoryLabels = {
  orders: { fr: "Commandes", sl: "Naročila" },
  inquiries: { fr: "Messages clients", sl: "Sporočila kupcev" },
  email: { fr: "Événements e-mail", sl: "E-poštni dogodki" },
};
const categoryIcons = { orders: ClipboardList, inquiries: MessageSquare, email: Mail };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NotificationsContext = createContext<NotificationsContext | null>(null);

function isNotificationsData(value: unknown): value is AdminNotificationsData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<AdminNotificationsData>;
  return Boolean(data.counts && categories.every(category => Number.isSafeInteger(data.counts?.[category]) && (data.counts?.[category] ?? -1) >= 0)
    && Array.isArray(data.items) && data.items.length <= 12 && data.items.every(item => item && categories.includes(item.category)
      && typeof item.entityId === "string" && uuid.test(item.entityId) && typeof item.label === "string"
      && typeof item.status === "string" && typeof item.createdAt === "string" && Number.isFinite(Date.parse(item.createdAt))));
}

export function AdminNotificationsProvider({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  const [data, setData] = useState<AdminNotificationsData | null>(null);
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState(false);
  const [connection, setConnection] = useState<Connection>("connecting");
  const scheduleRef = useRef<(() => void) | null>(null);
  const refresh = useCallback(() => scheduleRef.current?.(), []);
  const markRead = useCallback(async (category: AdminNotificationCategory, entityIds: readonly string[]): Promise<ReadResult> => {
    if (disabled) return { status: "error" };
    const ids = [...new Set(entityIds)].filter(id => uuid.test(id));
    if (!ids.length) return { status: "success" };
    try {
      // Only the server determines which records this administrator may mark.
      for (let offset = 0; offset < ids.length; offset += 100) {
        const result = await markAdminNotificationsRead(category, ids.slice(offset, offset + 100));
        if (result.status !== "success") { refresh(); return result; }
      }
      refresh();
      return { status: "success" };
    } catch {
      return { status: "error" };
    }
  }, [disabled, refresh]);

  useEffect(() => {
    if (disabled) return;
    const client = createClient();
    let active = true;
    let subscribed = false;
    let timer: number | undefined;
    let request: AbortController | undefined;
    const channel = client?.channel(`admin-notifications-${crypto.randomUUID()}`);

    const load = async () => {
      if (!active || document.visibilityState !== "visible" || !navigator.onLine) return;
      request?.abort();
      const controller = new AbortController();
      request = controller;
      setLoading(true);
      try {
        const response = await fetch("/admin/notifications", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        if (!active || controller.signal.aborted) return;
        if (response.status === 401 || response.status === 403) {
          setData(null);
          setConnection("fallback");
          throw new Error("access_unavailable");
        }
        if (!response.ok) throw new Error("notifications_unavailable");
        const result: unknown = await response.json();
        if (!isNotificationsData(result)) throw new Error("notifications_invalid");
        if (!active || controller.signal.aborted) return;
        setData(result);
        setError(false);
      } catch {
        if (active && !controller.signal.aborted) setError(true);
      } finally {
        if (active && !controller.signal.aborted) setLoading(false);
      }
    };
    const schedule = () => {
      if (!active) return;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => { void load(); }, 350);
    };
    scheduleRef.current = schedule;
    const onVisible = () => { if (document.visibilityState === "visible") schedule(); };
    const onOffline = () => { if (active) setConnection("offline"); };
    const onOnline = () => {
      if (!active) return;
      const joined = subscribed && channel?.state === "joined" && client?.realtime.isConnected();
      setConnection(joined ? "live" : "fallback");
      schedule();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    const poll = window.setInterval(onVisible, 30_000);
    const initial = window.setTimeout(() => {
      if (!active) return;
      setConnection(navigator.onLine ? (client ? "connecting" : "fallback") : "offline");
      if (!navigator.onLine) setLoading(false);
      void load();
    }, 0);

    const subscribe = async () => {
      if (!client || !channel) return;
      try {
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (!active) return;
        if (sessionError || !sessionData.session) {
          setConnection(navigator.onLine ? "fallback" : "offline");
          return;
        }
        await client.realtime.setAuth(sessionData.session.access_token);
        if (!active) return;
        for (const table of ["orders", "quote_requests", "email_events"]) {
          channel.on("postgres_changes", { event: "INSERT", schema: "public", table }, schedule);
          channel.on("postgres_changes", { event: "UPDATE", schema: "public", table }, schedule);
        }
        channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notification_reads", filter: `profile_id=eq.${sessionData.session.user.id}` }, schedule);
        channel.subscribe(status => {
          if (!active) return;
          if (status === "SUBSCRIBED") {
            subscribed = true;
            setConnection(navigator.onLine ? "live" : "offline");
            schedule();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            subscribed = false;
            setConnection(navigator.onLine ? "fallback" : "offline");
          }
        });
      } catch {
        if (active) setConnection(navigator.onLine ? "fallback" : "offline");
      }
    };
    void subscribe();
    return () => {
      active = false;
      scheduleRef.current = null;
      request?.abort();
      window.clearTimeout(initial);
      if (timer !== undefined) window.clearTimeout(timer);
      window.clearInterval(poll);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      if (client && channel) void client.removeChannel(channel);
    };
  }, [disabled]);

  const value = useMemo(() => ({ data, loading, error, enabled: !disabled, connection, refresh, markRead }), [data, loading, error, disabled, connection, refresh, markRead]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useAdminNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("AdminNotificationsProvider is required");
  return context;
}

/** Place this marker at the start of the rendered record or selected detail. */
export function AdminNotificationsSeen({ category, entityIds }: { category: AdminNotificationCategory; entityIds: readonly string[] }) {
  const { enabled, markRead } = useAdminNotifications();
  const marker = useRef<HTMLSpanElement>(null);
  const seen = useRef(new Set<string>());
  const pending = useRef(new Set<string>());
  const idsKey = [...new Set(entityIds)].filter(id => uuid.test(id)).sort().join(",");

  useEffect(() => {
    if (!enabled || !idsKey || !marker.current) return;
    let active = true;
    const visibleIds = new Set<string>();
    const prefixes = { orders: "order-", inquiries: "demande-", email: "email-" };
    const targets = new Map<Element, string>();
    for (const id of idsKey.split(",")) {
      const target = document.getElementById(`${prefixes[category]}${id}`);
      if (target) targets.set(target, id);
    }
    const markVisible = () => {
      if (!active || document.visibilityState !== "visible" || !navigator.onLine) return;
      const ids = [...visibleIds].filter(id => !seen.current.has(`${category}:${id}`) && !pending.current.has(`${category}:${id}`));
      if (!ids.length) return;
      ids.forEach(id => pending.current.add(`${category}:${id}`));
      void markRead(category, ids).then(result => {
        ids.forEach(id => {
          pending.current.delete(`${category}:${id}`);
          if (result.status === "success") seen.current.add(`${category}:${id}`);
        });
      });
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = targets.get(entry.target);
        if (id) {
          if (entry.isIntersecting) visibleIds.add(id);
          else visibleIds.delete(id);
        }
      }
      markVisible();
    });
    for (const target of targets.keys()) observer.observe(target);
    const retry = window.setInterval(markVisible, 30_000);
    document.addEventListener("visibilitychange", markVisible);
    window.addEventListener("focus", markVisible);
    window.addEventListener("online", markVisible);
    return () => {
      active = false;
      observer.disconnect();
      window.clearInterval(retry);
      document.removeEventListener("visibilitychange", markVisible);
      window.removeEventListener("focus", markVisible);
      window.removeEventListener("online", markVisible);
    };
  }, [category, idsKey, enabled, markRead]);
  return <span className="admin-notifications-seen" aria-hidden="true" ref={marker} />;
}

function NotificationsStatus() {
  const { enabled, error, loading, data, connection } = useAdminNotifications();
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const state = !enabled ? "disabled" : error ? "error" : connection;
  let text = fr ? "Connexion en cours…" : "Vzpostavljanje povezave…";
  if (!enabled) text = fr ? "Notifications désactivées dans cet aperçu" : "Obvestila so v predogledu izklopljena";
  else if (error) text = data ? (fr ? "Dernier relevé affiché · actualisation indisponible" : "Zadnji podatki · osveževanje ni na voljo") : (fr ? "Notifications indisponibles" : "Obvestila niso na voljo");
  else if (connection === "offline") text = fr ? "Hors connexion · reprise automatique" : "Brez povezave · samodejna ponovna povezava";
  else if (loading && !data) text = fr ? "Chargement des notifications…" : "Nalaganje obvestil…";
  else if (connection === "live") text = fr ? "En direct" : "V živo";
  else if (connection === "fallback") text = fr ? "Actualisation toutes les 30 s" : "Osveževanje vsakih 30 s";
  return <p className={`admin-notification-status is-${state}`} role="status"><span aria-hidden="true" />{text}</p>;
}

function notificationHref(item: AdminNotification): Route {
  const id = encodeURIComponent(item.entityId);
  return (item.category === "orders" ? `${destinations.orders}?order=${id}#order-${id}` : item.category === "inquiries" ? `${destinations.inquiries}?message=${id}#demande-${id}` : `${destinations.email}?event=${id}#email-${id}`) as Route;
}

function notificationStatus(status: string, locale: "fr" | "sl") {
  const labels: Record<string, { fr: string; sl: string }> = {
    new: { fr: "Nouveau", sl: "Novo" }, in_review: { fr: "En cours", sl: "V obravnavi" }, responded: { fr: "Répondu", sl: "Odgovorjeno" }, closed: { fr: "Clôturé", sl: "Zaključeno" },
    pending: { fr: "En attente", sl: "V čakanju" }, awaiting_payment: { fr: "Paiement attendu", sl: "Čaka na plačilo" }, paid: { fr: "Payé", sl: "Plačano" }, processing: { fr: "En préparation", sl: "V pripravi" }, shipped: { fr: "Expédié", sl: "Odposlano" }, delivered: { fr: "Livré", sl: "Dostavljeno" }, cancelled: { fr: "Annulé", sl: "Preklicano" }, refunded: { fr: "Remboursé", sl: "Povrnjeno" },
    queued: { fr: "En attente d’envoi", sl: "Čaka na pošiljanje" }, sent: { fr: "Envoyé", sl: "Poslano" }, failed: { fr: "Échec", sl: "Neuspešno" }, bounced: { fr: "Rejeté", sl: "Zavrnjeno" }, complained: { fr: "Signalé", sl: "Prijavljeno" }, suppressed: { fr: "Envoi suspendu", sl: "Pošiljanje ustavljeno" }, deferred: { fr: "Différé", sl: "Odloženo" },
  };
  return labels[status]?.[locale] ?? status.slice(0, 36);
}

export function AdminNotificationsBell() {
  const { data, loading, enabled, error, refresh } = useAdminNotifications();
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const total = data ? categories.reduce((sum, category) => sum + data.counts[category], 0) : null;
  const title = fr ? "Notifications" : "Obvestila";
  const label = total === null ? title : `${title} · ${total} ${fr ? "non lues" : "neprebranih"}`;

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onPointer = (event: PointerEvent) => { if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="admin-notifications" ref={wrapper}>
      <button className="admin-notification-trigger" type="button" aria-label={label} aria-expanded={open} aria-controls={id} aria-haspopup="dialog" ref={trigger} onClick={() => setOpen(value => !value)}>
        <Bell size={20} aria-hidden="true" />
        {enabled && (total === null || total > 0) ? <span className="admin-notification-count" aria-hidden="true">{total === null ? (error ? "!" : "…") : total > 99 ? "99+" : total}</span> : null}
      </button>
      {open ? (
        <div id={id} className="admin-notification-panel" role="dialog" aria-labelledby={`${id}-title`}>
          <header><div><h2 id={`${id}-title`}>{title}</h2><NotificationsStatus /></div><button type="button" className="admin-notification-icon-button" aria-label={fr ? "Fermer les notifications" : "Zapri obvestila"} ref={close} onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={20} aria-hidden="true" /></button></header>
          <div className="admin-notification-categories">{categories.map(category => <Link href={destinations[category]} key={category} onClick={() => setOpen(false)}><span>{categoryLabels[category][locale]}</span><strong>{enabled ? data?.counts[category] ?? "—" : "—"}</strong></Link>)}</div>
          {data?.items.length ? <ul className="admin-notification-list">{data.items.map(item => {
            const Icon = categoryIcons[item.category];
            return <li key={`${item.category}:${item.entityId}`}><Link href={notificationHref(item)} onClick={() => setOpen(false)}>
              <span className="admin-notification-item-icon"><Icon aria-hidden="true" size={19} /></span>
              <span className="admin-notification-item-copy"><span className="admin-notification-category">{categoryLabels[item.category][locale]}</span><strong>{item.label.slice(0, 90)}</strong><span>{notificationStatus(item.status, locale)} · <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString(fr ? "fr-FR" : "sl-SI", { timeZone: "Europe/Ljubljana", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</time></span></span>
              <ChevronRight size={17} aria-hidden="true" />
            </Link></li>;
          })}</ul> : <p className="admin-notification-empty">{!enabled ? (fr ? "Connectez-vous pour consulter les notifications." : "Za ogled obvestil se prijavite.") : data && !error ? (fr ? "Vous avez consulté toutes les nouveautés." : "Vse novosti ste že pregledali.") : loading ? (fr ? "Chargement…" : "Nalaganje…") : (fr ? "Les notifications ne peuvent pas être chargées pour le moment." : "Obvestil trenutno ni mogoče naložiti.")}</p>}
          <footer><p>{fr ? "12 dernières notifications non lues. Elles sont lues lorsque vous consultez leur contenu." : "Zadnjih 12 neprebranih obvestil. Kot prebrana se označijo ob ogledu vsebine."}</p><button type="button" className="admin-notification-refresh" onClick={refresh} disabled={!enabled || loading}><RefreshCw size={15} aria-hidden="true" />{fr ? "Actualiser" : "Osveži"}</button></footer>
        </div>
      ) : null}
    </div>
  );
}

export function AdminNotificationNavBadge({ category }: { category: AdminNotificationCategory }) {
  const { data, enabled, error } = useAdminNotifications();
  const { locale } = useAdminLanguage();
  if (!enabled) return null;
  const count = data?.counts[category];
  if (count === 0) return null;
  const label = count === undefined ? (locale === "fr" ? "Nombre de notifications indisponible" : "Število obvestil ni na voljo") : `${count} ${locale === "fr" ? "non lues" : "neprebranih"}`;
  return <span className="admin-notification-nav-badge" aria-label={label} title={label}>{count === undefined ? (error ? "!" : "…") : count > 99 ? "99+" : count}</span>;
}

export function AdminNotificationsSummary() {
  const { data, enabled } = useAdminNotifications();
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  return <section className="admin-notification-summary" aria-label={fr ? "Nouveautés à consulter" : "Novosti za pregled"}>
    <header><h2>{fr ? "Nouveautés à consulter" : "Novosti za pregled"}</h2><NotificationsStatus /></header>
    <div className="admin-notification-summary-grid">{categories.map(category => {
      const Icon = categoryIcons[category];
      return <Link href={destinations[category]} key={category} className="admin-notification-summary-card"><span className="admin-notification-summary-icon"><Icon size={22} aria-hidden="true" /></span><span><span>{categoryLabels[category][locale]}</span><strong>{enabled ? data?.counts[category] ?? "—" : "—"}<small>{fr ? "non lues" : "neprebranih"}</small></strong></span><ChevronRight size={19} aria-hidden="true" /></Link>;
    })}</div>
  </section>;
}
