import type { Metadata } from "next";

import { AdminNewPasswordForm, AdminPasswordExpired } from "@/components/admin/password-forms";
import { getAdminAccess } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Novo skrbniško geslo",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default async function AdminNewPasswordPage() {
  const access = await getAdminAccess();
  return access.status === "authorized" ? <AdminNewPasswordForm /> : <AdminPasswordExpired />;
}
