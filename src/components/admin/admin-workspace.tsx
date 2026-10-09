"use client";

import {
  BarChart3,
  BookOpenText,
  Boxes,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Languages,
  LogOut,
  Mail,
  PackageSearch,
  Settings,
  ShieldCheck,
  UsersRound,
  Truck,
  TicketPercent,
  History,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAdmin } from "@/actions/admin-auth";
import {
  type AdminTranslationKey,
  useAdminLanguage,
} from "@/components/admin/admin-i18n";
import type { AdminPageAccess } from "@/lib/auth/admin-page";

type WorkspaceAccess = Exclude<AdminPageAccess, { mode: "not_configured" }>;

export type AdminSectionId =
  | "dashboard"
  | "products"
  | "orders"
  | "inventory"
  | "customers"
  | "shipping"
  | "promotions"
  | "activity"
  | "inquiries"
  | "guides"
  | "email"
  | "analytics"
  | "settings";

const navigation = [
  { id: "dashboard", labelKey: "nav.dashboard", href: "/admin", icon: LayoutDashboard },
  { id: "products", labelKey: "nav.products", href: "/admin/izdelki", icon: PackageSearch },
  { id: "orders", labelKey: "nav.orders", href: "/admin/narocila", icon: ClipboardList },
  { id: "inventory", labelKey: "nav.inventory", href: "/admin/zaloga", icon: Boxes },
  { id: "customers", labelKey: "nav.customers", href: "/admin/stranke", icon: UsersRound },
  { id: "shipping", labelKey: "nav.shipping", href: "/admin/dostava", icon: Truck },
  { id: "promotions", labelKey: "nav.promotions", href: "/admin/promocije", icon: TicketPercent },
  { id: "inquiries", labelKey: "nav.inquiries", href: "/admin/povprasevanja", icon: UsersRound },
  { id: "guides", labelKey: "nav.guides", href: "/admin/vodici", icon: BookOpenText },
  { id: "email", labelKey: "nav.email", href: "/admin/e-posta", icon: Mail },
  { id: "analytics", labelKey: "nav.analytics", href: "/admin/analitika", icon: BarChart3 },
  { id: "activity", labelKey: "nav.activity", href: "/admin/dnevnik", icon: History },
  { id: "settings", labelKey: "nav.settings", href: "/admin/nastavitve", icon: Settings },
] as const satisfies ReadonlyArray<{
  id: string;
  labelKey: AdminTranslationKey;
  icon: typeof LayoutDashboard;
  href?: string;
}>;

export function AdminWorkspace({
  access,
  active,
  children,
}: {
  access: WorkspaceAccess;
  active: AdminSectionId;
  children: ReactNode;
}) {
  const { locale, t, toggleLanguage } = useAdminLanguage();

  return (
    <div className="admin-workspace">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">
          <span>{t("sidebar.eyebrow")}</span>
          <strong>Bistrava</strong>
        </div>
        <nav aria-label={t("nav.aria")} className="admin-navigation">
          {navigation.map(({ id, labelKey, icon: Icon, ...item }) =>
            "href" in item ? (
              <Link
                aria-current={active === id ? "page" : undefined}
                className={active === id ? "is-active" : undefined}
                href={item.href}
                key={id}
              >
                <Icon aria-hidden="true" size={19} />
                <span>{t(labelKey)}</span>
              </Link>
            ) : (
              <span aria-disabled="true" className="is-disabled" key={id}>
                <Icon aria-hidden="true" size={19} />
                <span>{t(labelKey)}</span>
                <small>{t("nav.soon")}</small>
              </span>
            ),
          )}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" target="_blank">
            <ExternalLink aria-hidden="true" size={18} />
            {t("nav.openStore")}
          </Link>
        </div>
      </aside>
      <div className="admin-workspace-main">
        <div className="admin-toolbar">
          <div className="admin-environment">
            <span className={access.mode === "preview" ? "is-preview" : "is-secure"}>
              <ShieldCheck aria-hidden="true" size={16} />
              {access.mode === "preview" ? t("toolbar.localPreview") : `${access.label} · ${access.role}`}
            </span>
          </div>
          <div className="admin-toolbar-actions">
            {access.mode === "authenticated" ? (
              <form action={signOutAdmin}>
                <button className="admin-signout" type="submit">
                  <LogOut aria-hidden="true" size={17} />
                  {t("toolbar.logout")}
                </button>
              </form>
            ) : (
              <span className="admin-preview-label">{t("toolbar.noWriting")}</span>
            )}
            <button
              aria-label={
                locale === "sl"
                  ? t("language.switchToFrench")
                  : t("language.switchToSlovenian")
              }
              className="admin-language-toggle"
              onClick={toggleLanguage}
              type="button"
            >
              <Languages aria-hidden="true" size={17} />
              {locale === "sl" ? t("language.french") : t("language.slovenian")}
            </button>
          </div>
        </div>
        <div className="admin-workspace-content">{children}</div>
      </div>
    </div>
  );
}
