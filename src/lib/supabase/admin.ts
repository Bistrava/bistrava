import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerSupabaseConfig } from "@/lib/validation/env";

export function createAdminClient() {
  const config = getServerSupabaseConfig();
  if (!config) return null;

  return createClient(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
