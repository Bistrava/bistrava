import { z } from "zod";

const publicSupabaseSchema = z.object({
  url: z.string().url(),
  publishableKey: z.string().min(20),
});

const serverSupabaseSchema = publicSupabaseSchema.extend({
  secretKey: z.string().min(20),
});

export type PublicSupabaseConfig = z.infer<typeof publicSupabaseSchema>;
export type ServerSupabaseConfig = z.infer<typeof serverSupabaseSchema>;

export function getPublicSupabaseConfig(): PublicSupabaseConfig | null {
  const result = publicSupabaseSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  return result.success ? result.data : null;
}

export function getServerSupabaseConfig(): ServerSupabaseConfig | null {
  const publicConfig = getPublicSupabaseConfig();
  if (!publicConfig) return null;

  const result = serverSupabaseSchema.safeParse({
    ...publicConfig,
    secretKey: process.env.SUPABASE_SECRET_KEY,
  });

  return result.success ? result.data : null;
}
