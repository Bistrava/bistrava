import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { InquiriesView } from "@/components/admin/inquiries-view";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
export const dynamic = "force-dynamic";
const fields = "id,name,email,phone,message,status,internal_note,product_slug,created_at,updated_at";
export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <p>Supabase ni povezan.</p>;
  const requested = z.uuid().safeParse((await searchParams).message);
  const initialInquiryId = requested.success ? requested.data : undefined;
  const client = await createClient();
  const result = client ? await client.from("quote_requests").select(fields).order("created_at", { ascending: false }).limit(100) : null;
  const items = result?.error ? null : result?.data ?? null;
  if (client && items && initialInquiryId && !items.some(item => item.id === initialInquiryId)) {
    const selected = await client.from("quote_requests").select(fields).eq("id", initialInquiryId).maybeSingle();
    if (selected.data) items.unshift(selected.data);
  }
  return <AdminWorkspace access={access} active="inquiries"><InquiriesView items={items} initialInquiryId={initialInquiryId} canManage={access.mode === "authenticated" && access.role === "admin"} liveEnabled={access.mode === "authenticated"} /></AdminWorkspace>;
}
