export const CONSENT_STORAGE_KEY = "bistrava-consent-v2";

/** "marketing" grants statistics and advertising measurement together. */
export type ConsentChoice = "marketing" | "statistics" | "denied";

export function parseConsentChoice(value: unknown): ConsentChoice | null {
  return value === "marketing" || value === "statistics" || value === "denied" ? value : null;
}

const consentLevels: Record<ConsentChoice, number> = { denied: 0, statistics: 1, marketing: 2 };

export function allowsStatistics(choice: ConsentChoice | null) {
  return choice === "statistics" || choice === "marketing";
}

/** True when the new choice withdraws a permission the previous one had granted. */
export function isConsentWithdrawal(previous: ConsentChoice | null, next: ConsentChoice | null) {
  return previous !== null && consentLevels[previous] > (next === null ? 0 : consentLevels[next]);
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
    analytics_storage: allowsStatistics(choice) ? "granted" : "denied",
    ad_storage: choice === "marketing" ? "granted" : "denied",
    ad_user_data: choice === "marketing" ? "granted" : "denied",
    ad_personalization: choice === "marketing" ? "granted" : "denied",
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
