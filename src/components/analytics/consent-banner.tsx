"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConsentChoice = "granted" | "denied";

function updateGoogleConsent(choice: ConsentChoice) {
  const win = window as typeof window & {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };
  win.dataLayer = win.dataLayer || [];
  win.gtag = win.gtag || ((...args: unknown[]) => win.dataLayer?.push(args));
  win.gtag("consent", "update", {
    analytics_storage: choice,
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("bistrava-consent-v1") as ConsentChoice | null;
    if (saved === "granted" || saved === "denied") updateGoogleConsent(saved);
    const timer =
      saved === "granted" || saved === "denied"
        ? undefined
        : window.setTimeout(() => setVisible(true), 0);

    const reopen = () => setVisible(true);
    window.addEventListener("bistrava:open-consent", reopen);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("bistrava:open-consent", reopen);
    };
  }, []);

  function choose(choice: ConsentChoice) {
    window.localStorage.setItem("bistrava-consent-v1", choice);
    updateGoogleConsent(choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="consent-banner" aria-label="Nastavitve zasebnosti">
      <div>
        <strong>Nastavitve zasebnosti</strong>
        <p>
          Bistvene funkcije delujejo brez trženjskih piškotkov. Z dovoljenjem
          lahko vklopimo statistiko in oglaševalsko merjenje. <Link href="/piskotki">Več informacij</Link>
        </p>
      </div>
      <div className="consent-actions">
        <button className="button button-secondary" type="button" onClick={() => choose("denied")}>Samo bistveno</button>
        <button className="button button-primary" type="button" onClick={() => choose("granted")}>Dovoli statistiko</button>
      </div>
    </aside>
  );
}

export function PrivacySettingsButton() {
  return (
    <button
      className="footer-privacy-button"
      type="button"
      onClick={() => window.dispatchEvent(new Event("bistrava:open-consent"))}
    >
      Nastavitve zasebnosti
    </button>
  );
}
