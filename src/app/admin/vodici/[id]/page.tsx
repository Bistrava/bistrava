import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminGuideEditor } from "@/components/admin/admin-guide-editor";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getAdminGuides } from "@/lib/content/guides-repository";
import { getAdminPageAccess } from "@/lib/auth/admin-page";

export const metadata: Metadata = { title: "Uredi vodnik · Administracija" };
export const dynamic = "force-dynamic";
export default async function AdminGuidePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <section className="admin-content"><h1>Urejanje vodnikov potrebuje Supabase.</h1></section>;
  const [{ id }, search, data] = await Promise.all([params, searchParams, getAdminGuides()]);
  const guide = data.guides.find((item) => item.id === id);
  if (!guide) notFound();
  return <AdminWorkspace access={access} active="guides"><AdminGuideEditor canManage={access.mode === "authenticated" && access.role === "admin"} guide={guide} key={guide.version} saved={search.saved === "1"} /></AdminWorkspace>;
}
