export const CONSENT_STORAGE_KEY = "bistrava-consent-v2";

export type ConsentChoice = "statistics" | "denied";

export function parseConsentChoice(value: unknown): ConsentChoice | null {
  return value === "statistics" || value === "denied" ? value : null;
}

export function readConsentChoice(storage: Pick<Storage, "getItem">): ConsentChoice | null {
  try {
    return parseConsentChoice(storage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveConsentChoice(storage: Pick<Storage, "setItem">, choice: ConsentChoice): boolean {
  try {
    storage.setItem(CONSENT_STORAGE_KEY, choice);
    return true;
  } catch {
    return false;
  }
}

export function googleConsentSettings(choice: ConsentChoice | null) {
  return {
    analytics_storage: choice === "statistics" ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  } as const;
}

type GoogleConsentTarget = {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
};

declare global {
  interface Window {
    gtag?: GoogleConsentTarget["gtag"];
    dataLayer?: unknown[];
  }
}

export function updateGoogleConsent(target: GoogleConsentTarget, choice: ConsentChoice | null) {
  target.dataLayer = target.dataLayer || [];
  target.gtag = target.gtag || ((...args: unknown[]) => target.dataLayer?.push(args));
  target.gtag("consent", "update", googleConsentSettings(choice));
}
