import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { EmailEventsView } from "@/components/admin/email-events-view";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { MailboxView } from '@/components/admin/mailbox-view';
export const dynamic = "force-dynamic";
const fields = "id,email_type,status,occurred_at,error_code";
export default async function EmailPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <p>Supabase ni povezan.</p>;
  const requested = z.uuid().safeParse((await searchParams).event);
  const client = await createClient();
  const result = client ? await client.from("email_events").select(fields).not('idempotency_key','like','inbox:%').order("occurred_at", { ascending: false }).limit(100) : null;
  const events = result?.error ? null : result?.data ?? null;
  if (client && events && requested.success && !events.some(event => event.id === requested.data)) {
    const selected = await client.from("email_events").select(fields).not('idempotency_key','like','inbox:%').eq("id", requested.data).maybeSingle();
    if (selected.data) events.unshift(selected.data);
  }
  const configured = Boolean(process.env.LWS_MAIL_PASSWORD || (process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.EMAIL_REPLY_TO));
  return <AdminWorkspace access={access} active="email"><MailboxView initialId={requested.success ? requested.data : undefined}/><details style={{marginTop:'2rem'}}><summary>Journal / Dnevnik</summary><EmailEventsView events={events} configured={configured} liveEnabled={access.mode === "authenticated"} /></details></AdminWorkspace>;
}
