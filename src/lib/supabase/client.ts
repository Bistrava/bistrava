"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseConfig } from "@/lib/validation/env";

export function createClient() {
  const config = getPublicSupabaseConfig();
  if (!config) return null;

  return createBrowserClient(config.url, config.publishableKey, {
    cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" },
  });
}
