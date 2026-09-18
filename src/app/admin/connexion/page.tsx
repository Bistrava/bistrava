import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";

import { signInAdmin } from "@/actions/admin-auth";
import { getPublicSupabaseConfig } from "@/lib/validation/env";

export const metadata: Metadata = {
  title: "Prijava v administracijo",
  robots: { index: false, follow: false, noarchive: true },
};

const errorMessages: Record<string, string> = {
  invalid: "Preverite obliko e-pošte in dolžino gesla.",
  credentials: "Prijava ni uspela. Preverite vnesene podatke.",
  denied: "Ta račun nima dovoljenja za skrbniški dostop.",
  configuration: "Povezava s Supabase še ni nastavljena.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = Boolean(getPublicSupabaseConfig());

  return (
    <section className="admin-login-section">
      <div className="admin-login-card card">
        <span className="admin-lock">
          <LockKeyhole aria-hidden="true" size={28} />
        </span>
        <p className="section-kicker">Bistrava administracija</p>
        <h1>Varna prijava</h1>
        <p>
          Javno ustvarjanje skrbniških računov ni omogočeno. Prvi račun se
          ustvari po ročnem postopku v dokumentaciji.
        </p>

        {!configured ? (
          <div className="notice" role="status">
            Supabase še ni povezan. Izpolnite javni URL in publishable ključ,
            nato ustvarite prvega skrbnika po dokumentiranem postopku.
          </div>
        ) : null}

        {error && errorMessages[error] ? (
          <div className="notice notice-danger" role="alert">
            {errorMessages[error]}
          </div>
        ) : null}

        <form action={signInAdmin}>
          <div className="form-field">
            <label htmlFor="admin-email">E-pošta</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              disabled={!configured}
            />
          </div>
          <div className="form-field">
            <label htmlFor="admin-password">Geslo</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
              disabled={!configured}
            />
          </div>
          <button className="button button-primary" disabled={!configured}>
            Prijava
          </button>
        </form>
      </div>
    </section>
  );
}
