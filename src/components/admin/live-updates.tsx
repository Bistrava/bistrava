"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdminLanguage } from "./admin-i18n";

export type AdminLiveTable = "quote_requests" | "email_events";
type Connection = "connecting" | "live" | "fallback" | "offline";

type LiveUpdatesProps = {
  tables: readonly AdminLiveTable[];
  paused?: boolean;
  disabled?: boolean;
};

export function AdminLiveUpdates(props: LiveUpdatesProps) {
  const subscriptionKey = `${props.disabled ? "disabled" : "enabled"}:${[...new Set(props.tables)].sort().join(",")}`;
  return <LiveUpdatesStatus key={subscriptionKey} {...props} />;
}

function LiveUpdatesStatus({ tables, paused = false, disabled = false }: LiveUpdatesProps) {
  const router = useRouter();
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [connection, setConnection] = useState<Connection>("connecting");
  const [queued, setQueued] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const pausedRef = useRef(paused);
  const scheduleRef = useRef<(() => void) | null>(null);
  const tableKey = [...new Set(tables)].sort().join(",");

  useEffect(() => {
    const wasPaused = pausedRef.current;
    pausedRef.current = paused;
    if (wasPaused && !paused) scheduleRef.current?.();
  }, [paused]);

  useEffect(() => {
    if (disabled || !tableKey) return;
    const client = createClient();
    let active = true;
    let subscribed = false;
    let refreshTimer: number | undefined;

    const refresh = () => {
      if (!active) return;
      if (pausedRef.current || document.visibilityState !== "visible" || !navigator.onLine) {
        setQueued(true);
        return;
      }
      setQueued(false);
      startTransition(() => router.refresh());
    };
    const schedule = () => {
      if (!active) return;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(refresh, 400);
    };
    scheduleRef.current = schedule;

    // Polling also catches changes missed while the subscription reconnects.
    const pollTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") schedule();
    }, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    const onOffline = () => setConnection("offline");
    const onOnline = () => {
      const joined = subscribed && channel?.state === "joined" && client?.realtime.isConnected();
      setConnection(joined ? "live" : "fallback");
      schedule();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    const initialTimer = window.setTimeout(() => {
      if (active) setConnection(navigator.onLine ? (client ? "connecting" : "fallback") : "offline");
    }, 0);
    // Each effect setup owns its channel. A stable name can reuse a channel whose
    // asynchronous cleanup is still running during Strict Mode's effect replay.
    const channel = client?.channel(`admin-live-${tableKey}-${crypto.randomUUID()}`);
    for (const table of tableKey.split(",") as AdminLiveTable[]) {
      channel?.on("postgres_changes", { event: "INSERT", schema: "public", table }, schedule);
      channel?.on("postgres_changes", { event: "UPDATE", schema: "public", table }, schedule);
    }
    const subscribe = async () => {
      if (!client || !channel) return;
      try {
        // The WebSocket can connect before the browser cookie session has
        // finished loading. Authorize the initial join explicitly; otherwise
        // a successful anonymous join cannot receive these private records.
        const { data, error } = await client.auth.getSession();
        if (!active) return;
        if (error || !data.session) {
          window.clearTimeout(initialTimer);
          setConnection(navigator.onLine ? "fallback" : "offline");
          return;
        }
        await client.realtime.setAuth(data.session.access_token);
        if (!active) return;
        channel.subscribe((status) => {
          if (!active) return;
          window.clearTimeout(initialTimer);
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
        if (!active) return;
        window.clearTimeout(initialTimer);
        setConnection(navigator.onLine ? "fallback" : "offline");
      }
    };
    void subscribe();

    return () => {
      active = false;
      scheduleRef.current = null;
      window.clearTimeout(initialTimer);
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      window.clearInterval(pollTimer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      if (client && channel) void client.removeChannel(channel);
    };
  }, [disabled, tableKey, router]);

  const state = disabled ? "disabled" : paused ? "paused" : connection;
  const labels = {
    disabled: fr ? "Aperçu" : "Predogled",
    paused: fr ? "Actualisation en pause" : "Osveževanje je začasno ustavljeno",
    connecting: fr ? "Connexion en cours…" : "Vzpostavljanje povezave…",
    live: fr ? "En direct" : "V živo",
    fallback: fr ? "Actualisation toutes les 30 s" : "Osveževanje vsakih 30 s",
    offline: fr ? "Hors connexion" : "Brez povezave",
  };

  return (
    <div className={`ops-live-updates is-${state}`}>
      <div role="status" aria-live="polite">
        <span className="ops-live-label"><span className="ops-live-dot" aria-hidden="true" />{labels[state]}</span>
        <p>
          {disabled ? (fr ? "Les mises à jour automatiques sont désactivées dans cet aperçu." : "Samodejne posodobitve so v predogledu izklopljene.")
            : paused ? (queued
              ? (fr ? "Actualisation en attente. Enregistrez ou annulez vos modifications pour la reprendre." : "Posodobitev čaka. Shranite ali prekličite spremembe za nadaljevanje.")
              : (fr ? "Vos notes en cours de saisie sont conservées. Enregistrez ou annulez pour reprendre." : "Vaši osnutki opomb so ohranjeni. Shranite ali prekličite za nadaljevanje."))
            : refreshing ? (fr ? "Actualisation…" : "Osveževanje…")
            : connection === "offline" ? (fr ? "L’actualisation reprendra au retour de la connexion." : "Osveževanje se nadaljuje po ponovni povezavi.")
            : connection === "live" ? (fr ? "Les nouveaux événements actualisent cette page automatiquement." : "Novi dogodki samodejno osvežijo to stran.")
            : (fr ? "La page reste actualisée toutes les 30 secondes tant que cet onglet est visible." : "Stran se osveži vsakih 30 sekund, ko je ta zavihek viden.")}
        </p>
      </div>
      <button type="button" className="button button-secondary" disabled={disabled || paused || refreshing || connection === "offline"} onClick={() => scheduleRef.current?.()}>
        {fr ? "Actualiser" : "Osveži"}
      </button>
    </div>
  );
}
