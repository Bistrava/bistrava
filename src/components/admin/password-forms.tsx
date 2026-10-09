"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import {
  confirmAdminPasswordRecovery,
  requestAdminPasswordReset,
  updateAdminPassword,
} from "@/actions/admin-password";
import { useAdminLanguage } from "@/components/admin/admin-i18n";
import type { PasswordActionState } from "@/lib/validation/auth";

const initialState: PasswordActionState = { status: "idle" };

function PasswordCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const { locale, toggleLanguage } = useAdminLanguage();
  const fr = locale === "fr";

  return (
    <section className="admin-login-section">
      <div className="admin-login-card card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <span className="admin-lock"><LockKeyhole aria-hidden="true" size={28} /></span>
          <button type="button" className="button button-soft" onClick={toggleLanguage} lang={fr ? "sl" : "fr"}>
            {fr ? "Slovenščina" : "Français"}
          </button>
        </div>
        <p className="section-kicker">{fr ? "Administration Bistrava" : "Bistrava administracija"}</p>
        <h1 style={{ overflowWrap: "anywhere" }}>{title}</h1>
        <p>{description}</p>
        {children}
        <p style={{ marginTop: 24 }}>
          <Link href="/admin/connexion" style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>
            {fr ? "Retour à la connexion" : "Nazaj na prijavo"}
          </Link>
        </p>
      </div>
    </section>
  );
}

function PasswordActionNotice({ state }: { state: PasswordActionState }) {
  const { locale } = useAdminLanguage();
  if (state.status === "idle") return null;

  const fallback = state.status === "error"
    ? locale === "fr" ? "La demande n’a pas abouti. Veuillez réessayer." : "Zahteva ni uspela. Poskusite znova."
    : locale === "fr" ? "La demande a été prise en compte." : "Zahteva je bila obdelana.";

  return (
    <div className={`notice${state.status === "error" ? " notice-danger" : ""}`} role={state.status === "error" ? "alert" : "status"}>
      {state.message || fallback}
    </div>
  );
}

export function AdminPasswordRequestForm({ error }: { error?: "link" | "configuration" }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [state, action, pending] = useActionState(requestAdminPasswordReset, initialState);

  return (
    <PasswordCard
      title={fr ? "Mot de passe oublié ?" : "Pozabljeno geslo?"}
      description={fr ? "Indiquez l’adresse e-mail de votre compte administrateur pour demander un lien de récupération." : "Vnesite e-poštni naslov skrbniškega računa, da zahtevate povezavo za obnovitev gesla."}
    >
      {error ? (
        <div className="notice notice-danger" role="alert">
          {error === "link"
            ? (fr ? "Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien et ouvrez-le dans ce même navigateur." : "Povezava je potekla ali je že uporabljena. Zahtevajte novo in jo odprite v istem brskalniku.")
            : (fr ? "La récupération du mot de passe est momentanément indisponible. Veuillez réessayer plus tard." : "Obnovitev gesla trenutno ni na voljo. Poskusite pozneje.")}
        </div>
      ) : null}
      <form action={action} aria-busy={pending}>
        <input type="hidden" name="locale" value={locale} />
        <div className="form-field">
          <label htmlFor="recovery-email">{fr ? "Adresse e-mail" : "E-poštni naslov"}</label>
          <input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={254} required aria-describedby="recovery-email-help" />
          <small id="recovery-email-help">{fr ? "Ouvrez le lien reçu par e-mail dans ce même navigateur. Consultez aussi votre dossier de courriers indésirables." : "Povezavo iz e-pošte odprite v istem brskalniku, v katerem ste poslali zahtevo. Preverite tudi neželeno pošto."}</small>
        </div>
        <PasswordActionNotice state={state} />
        <button type="submit" className="button button-primary" disabled={pending}>
          {pending ? (fr ? "Envoi en cours…" : "Pošiljanje…") : (fr ? "Envoyer le lien" : "Pošlji povezavo")}
        </button>
      </form>
    </PasswordCard>
  );
}

function ConfirmRecoveryButton() {
  const { pending } = useFormStatus();
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  return (
    <button type="submit" className="button button-primary" disabled={pending}>
      {pending ? (fr ? "Vérification…" : "Preverjanje…") : (fr ? "Choisir un nouveau mot de passe" : "Izberi novo geslo")}
    </button>
  );
}

export function AdminPasswordConfirmationForm({ code, tokenHash }: { code?: string; tokenHash?: string }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const validLink = Boolean(code || tokenHash);

  return (
    <PasswordCard
      title={validLink ? (fr ? "Confirmer la récupération" : "Potrdite obnovitev gesla") : (fr ? "Lien invalide" : "Neveljavna povezava")}
      description={validLink
        ? (fr ? "Cliquez sur le bouton ci-dessous pour continuer et définir votre nouveau mot de passe." : "Za nadaljevanje in nastavitev novega gesla kliknite spodnji gumb.")
        : (fr ? "Ce lien de récupération est incomplet ou invalide. Demandez un nouveau lien pour continuer." : "Povezava za obnovitev je nepopolna ali neveljavna. Za nadaljevanje zahtevajte novo povezavo.")}
    >
      {validLink ? (
        <form action={confirmAdminPasswordRecovery}>
          <input type="hidden" name="locale" value={locale} />
          {code ? <input type="hidden" name="code" value={code} /> : null}
          {tokenHash ? <input type="hidden" name="token_hash" value={tokenHash} /> : null}
          <ConfirmRecoveryButton />
        </form>
      ) : (
        <div className="notice notice-danger" role="alert"><ForgotAdminPasswordLink /></div>
      )}
    </PasswordCard>
  );
}

export function AdminNewPasswordForm() {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [state, action, pending] = useActionState(updateAdminPassword, initialState);

  return (
    <PasswordCard
      title={fr ? "Nouveau mot de passe" : "Novo geslo"}
      description={fr ? "Choisissez un mot de passe unique pour votre compte administrateur." : "Za skrbniški račun izberite edinstveno geslo."}
    >
      {state.status === "success" ? <PasswordActionNotice state={state} /> : (
        <form action={action} aria-busy={pending}>
        <input type="hidden" name="locale" value={locale} />
        <div className="form-field">
          <label htmlFor="new-admin-password">{fr ? "Nouveau mot de passe" : "Novo geslo"}</label>
          <input id="new-admin-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required aria-describedby="new-admin-password-help" />
          <small id="new-admin-password-help">{fr ? "Entre 12 et 128 caractères." : "Od 12 do 128 znakov."}</small>
        </div>
        <div className="form-field">
          <label htmlFor="confirm-admin-password">{fr ? "Confirmer le mot de passe" : "Potrdite novo geslo"}</label>
          <input id="confirm-admin-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
        </div>
        <PasswordActionNotice state={state} />
        <button type="submit" className="button button-primary" disabled={pending}>
          {pending ? (fr ? "Enregistrement…" : "Shranjevanje…") : (fr ? "Enregistrer le mot de passe" : "Shrani novo geslo")}
        </button>
        </form>
      )}
    </PasswordCard>
  );
}

export function AdminPasswordExpired() {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  return (
    <PasswordCard
      title={fr ? "Lien expiré ou indisponible" : "Povezava je potekla ali ni veljavna"}
      description={fr ? "Votre accès à la récupération n’est plus disponible. Demandez un nouveau lien pour définir votre mot de passe." : "Dostop do obnovitve ni več na voljo. Za nastavitev gesla zahtevajte novo povezavo."}
    >
      <div className="notice" role="status"><ForgotAdminPasswordLink /></div>
    </PasswordCard>
  );
}

export function ForgotAdminPasswordLink() {
  const { locale } = useAdminLanguage();
  return (
    <Link href="/admin/mot-de-passe-oublie" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, textDecoration: "underline", textUnderlineOffset: 4 }}>
      {locale === "fr" ? "Mot de passe oublié ?" : "Pozabljeno geslo?"}
    </Link>
  );
}

export function AdminPasswordUpdatedNotice() {
  const { locale } = useAdminLanguage();
  return (
    <div className="notice" role="status">
      {locale === "fr" ? "Votre mot de passe a été modifié. Connectez-vous avec votre nouveau mot de passe." : "Geslo je spremenjeno. Prijavite se z novim geslom."}
    </div>
  );
}
