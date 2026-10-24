"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ConsentBanner } from "@/components/analytics/consent-banner";
import {
  allowsStatistics,
  CONSENT_STORAGE_KEY,
  isConsentWithdrawal,
  readConsentChoice,
  saveConsentChoice,
  updateGoogleConsent,
  type ConsentChoice,
} from "@/lib/analytics/consent";

// Shown (Instaon SRL) advertising tag manager; loaded only with advertising consent.
const SHOWN_PIXEL_SRC = "https://shown.io/metrics/L73YrjA78M";

export function Analytics() {
  const pathname = usePathname();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
  const hasTags = Boolean(gtmId || ga4Id);
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);
  const currentChoice = useRef<ConsentChoice | null>(null);

  useEffect(() => {
    function refreshConsent() {
      let saved: ConsentChoice | null = null;
      try {
        saved = readConsentChoice(window.localStorage);
      } catch {
        // Some browsers deny access to localStorage entirely. Optional tags stay off.
      }
      const previous = currentChoice.current;
      const withdrawn = isConsentWithdrawal(previous, saved) && (hasTags || previous === "marketing");
      updateGoogleConsent(window, saved);
      currentChoice.current = saved;
      setChoice(saved);
      setReady(true);
      if (withdrawn) window.location.reload();
    }

    const timer = window.setTimeout(refreshConsent, 0);
    const onStorage = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY || event.key === null) refreshConsent();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [hasTags]);

  function chooseConsent(next: ConsentChoice): boolean {
    let saved = false;
    try {
      saved = saveConsentChoice(window.localStorage, next);
    } catch {
      // Do not treat a failed write as a saved choice.
    }
    if (!saved) return false;

    const previous = currentChoice.current;
    const withdrawn = isConsentWithdrawal(previous, next) && (hasTags || previous === "marketing");
    updateGoogleConsent(window, next);
    currentChoice.current = next;
    setChoice(next);
    if (withdrawn) window.location.reload();
    return true;
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {allowsStatistics(choice) && gtmId ? (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      ) : null}
      {allowsStatistics(choice) && ga4Id && !gtmId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4-config" strategy="afterInteractive">
            {`window.gtag('js', new Date()); window.gtag('config', '${ga4Id}', { send_page_view: true });`}
          </Script>
        </>
      ) : null}
      {choice === "marketing" ? <Script id="shown-pixel" src={SHOWN_PIXEL_SRC} strategy="afterInteractive" /> : null}
      <ConsentBanner ready={ready} choice={choice} onChoose={chooseConsent} />
    </>
  );
}
