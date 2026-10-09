import type { Metadata } from "next";

import { AdminPasswordRequestForm } from "@/components/admin/password-forms";

export const metadata: Metadata = {
  title: "Obnovitev skrbniškega gesla",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default async function AdminForgotPasswordPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error === "link" || params.error === "configuration" ? params.error : undefined;
  return <AdminPasswordRequestForm error={error} />;
}
