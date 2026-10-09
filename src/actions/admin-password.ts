"use server";

import { redirect } from "next/navigation";

import { siteConfig } from "@/lib/seo/site";
import { createClient } from "@/lib/supabase/server";
import {
  adminNewPasswordSchema,
  adminRecoveryEmailSchema,
  adminRecoveryProofSchema,
  type PasswordActionState,
} from "@/lib/validation/auth";

function translated(formData: FormData, fr: string, sl: string) {
  return formData.get("locale") === "sl" ? sl : fr;
}

export async function requestAdminPasswordReset(
  _previous: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const parsed = adminRecoveryEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { status: "error", message: translated(formData, "Saisissez une adresse e-mail valide.", "Vnesite veljaven e-poštni naslov.") };

  const supabase = await createClient();
  if (!supabase) return { status: "error", message: translated(formData, "La récupération du mot de passe est momentanément indisponible.", "Obnovitev gesla trenutno ni na voljo.") };

  // Fixed, trusted application URL: never build an email destination from user input or Host headers.
  const redirectTo = new URL("/admin/obnovitev-gesla/potrditev", siteConfig.url).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  if (error) {
    if (error.status === 429) {
      return { status: "error", message: translated(formData, "Trop de demandes ont été effectuées. Patientez avant de réessayer et vérifiez les courriels déjà reçus.", "Poslanih je bilo preveč zahtev. Pred ponovnim poskusom počakajte in preverite že prejeto e-pošto.") };
    }
    return { status: "error", message: translated(formData, "Le lien n’a pas pu être envoyé. Réessayez plus tard ou demandez de l’aide au responsable du compte.", "Povezave ni bilo mogoče poslati. Poskusite pozneje ali se obrnite na skrbnika računa.") };
  }

  // The same response is used regardless of account existence. No signup or role changes.
  return {
    status: "success",
    message: translated(formData, "Si cette adresse correspond à un compte, vous recevrez un lien pour choisir votre mot de passe. Vérifiez aussi les courriers indésirables et ouvrez le lien dans ce même navigateur.", "Če je naslov povezan z računom, boste prejeli povezavo za izbiro gesla. Preverite tudi neželeno pošto in povezavo odprite v istem brskalniku."),
  };
}

export async function confirmAdminPasswordRecovery(formData: FormData) {
  const parsed = adminRecoveryProofSchema.safeParse({
    code: formData.get("code") || undefined,
    tokenHash: formData.get("token_hash") || undefined,
  });
  if (!parsed.success) redirect("/admin/mot-de-passe-oublie?error=link");

  const supabase = await createClient();
  if (!supabase) redirect("/admin/mot-de-passe-oublie?error=configuration");

  // Only an explicit POST consumes the one-use proof. Email scanners may GET the landing page safely.
  const result = parsed.data.tokenHash
    ? await supabase.auth.verifyOtp({ token_hash: parsed.data.tokenHash, type: "recovery" })
    : await supabase.auth.exchangeCodeForSession(parsed.data.code!);

  if (result.error) redirect("/admin/mot-de-passe-oublie?error=link");

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/admin/mot-de-passe-oublie?error=link");
  }

  const { data: role, error: roleError } = await supabase.from("admin_roles")
    .select("role").eq("profile_id", data.user.id).eq("active", true).maybeSingle();
  if (roleError || !role) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/admin/connexion?error=denied");
  }

  // Drop the proof from the URL before showing the password form.
  redirect("/admin/novo-geslo");
}

export async function updateAdminPassword(
  _previous: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const parsed = adminNewPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: translated(formData, "Utilisez entre 12 et 128 caractères et saisissez deux fois le même mot de passe.", "Uporabite od 12 do 128 znakov in dvakrat vnesite enako geslo.") };
  }

  const supabase = await createClient();
  if (!supabase) return { status: "error", message: translated(formData, "La modification du mot de passe est momentanément indisponible.", "Sprememba gesla trenutno ni na voljo.") };

  // getUser validates the current session with Supabase Auth before the sensitive change.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { status: "error", message: translated(formData, "Ce lien a expiré. Demandez un nouveau lien de récupération.", "Povezava je potekla. Zahtevajte novo povezavo za obnovitev gesla.") };
  }
  const { data: role, error: roleError } = await supabase.from("admin_roles")
    .select("role").eq("profile_id", data.user.id).eq("active", true).maybeSingle();
  if (roleError || !role) {
    return { status: "error", message: translated(formData, "Ce compte n’est pas autorisé à accéder à l’administration.", "Ta račun nima dovoljenja za skrbniški dostop.") };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (updateError) {
    if (updateError.code === "same_password") {
      return { status: "error", message: translated(formData, "Choisissez un mot de passe différent du précédent.", "Izberite geslo, ki se razlikuje od prejšnjega.") };
    }
    return { status: "error", message: translated(formData, "Ce mot de passe n’a pas pu être enregistré. Choisissez un mot de passe plus robuste et réessayez, ou demandez un nouveau lien.", "Gesla ni bilo mogoče shraniti. Izberite močnejše geslo in poskusite znova ali zahtevajte novo povezavo.") };
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) {
    return {
      status: "success",
      message: translated(formData, "Votre nouveau mot de passe est enregistré, mais la fermeture des autres sessions n’a pas pu être confirmée. Reconnectez-vous avec le nouveau mot de passe.", "Novo geslo je shranjeno, odjave drugih sej pa ni bilo mogoče potrditi. Prijavite se z novim geslom."),
    };
  }
  redirect("/admin/connexion?success=password-updated");
}
