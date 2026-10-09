import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { SettingsView } from "@/components/admin/settings-view";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { getCheckoutConfig } from "@/lib/commerce/config";
import { siteConfig } from "@/lib/seo/site";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const access = await getAdminPageAccess();
  if (access.mode === "not_configured") return <p>Supabase ni povezan.</p>;
  return <AdminWorkspace access={access} active="settings"><SettingsView settings={{ database: access.mode === "authenticated", email: Boolean(process.env.RESEND_API_KEY), hosting: Boolean(process.env.VERCEL), checkout: getCheckoutConfig().enabled, siteUrl: siteConfig.url, adminEmail: access.label, role: access.mode === "authenticated" ? access.role : "preview" }} /></AdminWorkspace>;
}
