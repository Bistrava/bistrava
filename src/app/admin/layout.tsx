import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminLanguageProvider } from "@/components/admin/admin-i18n";

export const metadata: Metadata = {
  title: "Administracija",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminLanguageProvider>
      <div className="admin-shell">
        <AdminHeader />
        <main id="glavna-vsebina">{children}</main>
      </div>
    </AdminLanguageProvider>
  );
}
