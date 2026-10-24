import { describe, expect, it, vi } from "vitest";

import {
  allowsStatistics,
  CONSENT_STORAGE_KEY,
  googleConsentSettings,
  isConsentWithdrawal,
  parseConsentChoice,
  readConsentChoice,
  saveConsentChoice,
  updateGoogleConsent,
} from "@/lib/analytics/consent";

describe("versioned statistics consent", () => {
  it("accepts only an explicit current statistics or essential-only choice", () => {
    expect(parseConsentChoice("marketing")).toBe("marketing");
    expect(parseConsentChoice("statistics")).toBe("statistics");
    expect(parseConsentChoice("denied")).toBe("denied");
    for (const value of [null, undefined, "", "granted", "analytics", "true", { analytics: true }]) {
      expect(parseConsentChoice(value)).toBeNull();
    }
  });

  it("does not reuse the legacy choice that bundled advertising and statistics", () => {
    const storage = {
      getItem: vi.fn((key: string) => key === "bistrava-consent-v1" ? "granted" : null),
    };
    expect(readConsentChoice(storage)).toBeNull();
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(CONSENT_STORAGE_KEY);
    expect(CONSENT_STORAGE_KEY).toBe("bistrava-consent-v2");
  });

  it("keeps all optional storage denied for unknown and essential-only choices", () => {
    for (const choice of [null, "denied"] as const) {
      expect(googleConsentSettings(choice)).toMatchObject({
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        functionality_storage: "granted",
        security_storage: "granted",
      });
    }
  });

  it("allows statistics without allowing advertising", () => {
    expect(googleConsentSettings("statistics")).toEqual({
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
    });
  });

  it("grants statistics and advertising together only for the marketing choice", () => {
    expect(googleConsentSettings("marketing")).toEqual({
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      functionality_storage: "granted",
      security_storage: "granted",
    });
    expect(allowsStatistics("marketing")).toBe(true);
    expect(allowsStatistics("statistics")).toBe(true);
    expect(allowsStatistics("denied")).toBe(false);
    expect(allowsStatistics(null)).toBe(false);
  });

  it("treats any reduction of granted consent as a withdrawal", () => {
    expect(isConsentWithdrawal("marketing", "statistics")).toBe(true);
    expect(isConsentWithdrawal("marketing", "denied")).toBe(true);
    expect(isConsentWithdrawal("statistics", "denied")).toBe(true);
    expect(isConsentWithdrawal("statistics", null)).toBe(true);
    expect(isConsentWithdrawal("statistics", "marketing")).toBe(false);
    expect(isConsentWithdrawal("denied", "denied")).toBe(false);
    expect(isConsentWithdrawal(null, "marketing")).toBe(false);
  });

  it("updates Google with denial when statistics consent is withdrawn", () => {
    const target = { gtag: vi.fn() };
    updateGoogleConsent(target, "statistics");
    updateGoogleConsent(target, "denied");
    expect(target.gtag).toHaveBeenNthCalledWith(1, "consent", "update", googleConsentSettings("statistics"));
    expect(target.gtag).toHaveBeenNthCalledWith(2, "consent", "update", googleConsentSettings("denied"));
  });

  it("persists withdrawal using the current key and handles unavailable storage without inventing consent", () => {
    const setItem = vi.fn();
    expect(saveConsentChoice({ setItem }, "denied")).toBe(true);
    expect(setItem).toHaveBeenCalledExactlyOnceWith(CONSENT_STORAGE_KEY, "denied");
    expect(readConsentChoice({ getItem: () => { throw new Error("storage unavailable"); } })).toBeNull();
    expect(saveConsentChoice({ setItem: () => { throw new Error("storage unavailable"); } }, "statistics")).toBe(false);
  });
});
