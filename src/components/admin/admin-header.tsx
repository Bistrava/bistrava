"use client";

import Image from "next/image";
import Link from "next/link";

import { useAdminLanguage } from "@/components/admin/admin-i18n";

export function AdminHeader() {
  const { t } = useAdminLanguage();

  return (
    <header className="admin-header">
      <Link href="/" aria-label={t("header.backToStore")}>
        <Image
          src="/brand/bistrava-logo-web.png"
          alt="Bistrava"
          width={610}
          height={157}
          sizes="158px"
          priority
          unoptimized
        />
      </Link>
      <span>{t("header.protected")}</span>
    </header>
  );
}
