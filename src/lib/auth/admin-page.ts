import "server-only";

import { redirect } from "next/navigation";

import { getAdminAccess } from "@/lib/auth/admin";

export type AdminPageAccess =
  | { mode: "preview"; label: "Lokalni predogled" }
  | { mode: "not_configured" }
  | {
      mode: "authenticated";
      label: string;
      role: "admin" | "editor";
    };

export async function getAdminPageAccess(): Promise<AdminPageAccess> {
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") redirect("/admin/connexion");
  if (access.status === "forbidden") redirect("/admin/connexion?error=denied");

  if (access.status === "not_configured") {
    if (process.env.NODE_ENV === "development") {
      return { mode: "preview", label: "Lokalni predogled" };
    }
    return { mode: "not_configured" };
  }

  return {
    mode: "authenticated",
    label: access.email ?? "Skrbnik",
    role: access.role,
  };
}
