import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { EmailEventsView } from "@/components/admin/email-events-view";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function EmailPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <p>Supabase ni povezan.</p>;
  const client = await createClient();
  const result = client ? await client.from("email_events").select("id,email_type,status,occurred_at,error_code").order("occurred_at", { ascending: false }).limit(100) : null;
  const configured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.EMAIL_REPLY_TO);
  return <AdminWorkspace access={access} active="email"><EmailEventsView events={result?.error ? null : result?.data ?? null} configured={configured} liveEnabled={access.mode === "authenticated"} /></AdminWorkspace>;
}
