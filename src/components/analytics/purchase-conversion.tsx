"use client";

import { useEffect } from "react";

import { readConsentChoice, type ConsentChoice } from "@/lib/analytics/consent";
import { sendPurchaseConversion, type PurchaseConversionOrder } from "@/lib/analytics/google-ads";

declare global {
  interface Window {
    __bistravaAdsReady?: boolean;
  }
}

/**
 * Reports a completed order to Google Ads once the visitor has allowed advertising measurement
 * and the Google Ads tag is configured. Renders nothing.
 */
export function PurchaseConversion({ order }: { order: PurchaseConversionOrder }) {
  useEffect(() => {
    let done = false;

    function storage() {
      try {
        return window.localStorage;
      } catch {
        return null;
      }
    }

    function currentChoice(): ConsentChoice | null {
      const store = storage();
      return store ? readConsentChoice(store) : null;
    }

    function attempt() {
      if (done || !window.__bistravaAdsReady) return;
      done = sendPurchaseConversion(window, storage(), currentChoice(), order) || done;
    }

    attempt();
    // The tag loads after consent; it may become ready after this page mounted.
    window.addEventListener("bistrava:ads-ready", attempt);
    window.addEventListener("bistrava:consent", attempt);
    return () => {
      window.removeEventListener("bistrava:ads-ready", attempt);
      window.removeEventListener("bistrava:consent", attempt);
    };
  }, [order]);

  return null;
}
