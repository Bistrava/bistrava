"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { ConsentChoice } from "@/lib/analytics/consent";

export function ConsentBanner({ ready, choice, onChoose }: {
  ready: boolean;
  choice: ConsentChoice | null;
  onChoose: (choice: ConsentChoice) => boolean;
}) {
  const [reopened, setReopened] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener("bistrava:open-consent", reopen);
    return () => {
      window.removeEventListener("bistrava:open-consent", reopen);
    };
  }, []);

  function choose(choice: ConsentChoice) {
    if (onChoose(choice)) {
      setReopened(false);
      setSaveFailed(false);
    } else {
      setSaveFailed(true);
    }
  }

  if (!ready || (!reopened && choice !== null)) return null;

  return (
    <aside className="consent-banner" aria-label="Nastavitve zasebnosti">
      <div>
        <strong>Nastavitve zasebnosti</strong>
        <p>
          Bistvene funkcije delujejo brez statističnih piškotkov. Z izbiro
          »Dovoli statistiko« omogočite samo statistiko obiska. Oglaševalsko
          merjenje je izključeno. Izbiro lahko kadar koli spremenite v nogi strani. <Link href="/piskotki">Več informacij</Link>
        </p>
        {saveFailed ? <p role="alert">Izbire ni bilo mogoče shraniti. Preverite nastavitve shranjevanja v brskalniku in poskusite znova.</p> : null}
      </div>
      <div className="consent-actions">
        <button className="button button-secondary" type="button" onClick={() => choose("denied")}>Samo bistveno</button>
        <button className="button button-primary" type="button" onClick={() => choose("statistics")}>Dovoli statistiko</button>
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
