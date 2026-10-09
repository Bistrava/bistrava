import type { Metadata } from "next";

import { AdminPasswordConfirmationForm } from "@/components/admin/password-forms";

export const metadata: Metadata = {
  title: "Potrditev obnovitve gesla",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default async function AdminPasswordConfirmationPage({ searchParams }: {
  searchParams: Promise<{ code?: string; token_hash?: string }>;
}) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code.trim() : undefined;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash.trim() : undefined;

  return <AdminPasswordConfirmationForm code={code} tokenHash={tokenHash} />;
}
