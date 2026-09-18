"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { adminSignInSchema } from "@/lib/validation/auth";

export async function signInAdmin(formData: FormData) {
  const credentials = adminSignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    redirect("/admin/connexion?error=invalid");
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect("/admin/connexion?error=configuration");
  }

  const { error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error) {
    redirect("/admin/connexion?error=credentials");
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    await supabase.auth.signOut();
    redirect("/admin/connexion?error=credentials");
  }

  const { data: roleRecord } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("profile_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (!roleRecord) {
    await supabase.auth.signOut();
    redirect("/admin/connexion?error=denied");
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/connexion");
}
