import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseConfig } from "@/lib/validation/env";

export async function updateSession(request: NextRequest) {
  const config = getPublicSupabaseConfig();
  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previousCookies = response.cookies.getAll();
        const previousCacheHeaders = ["cache-control", "expires", "pragma"].map((name) => [name, response.headers.get(name)] as const);
        response = NextResponse.next({ request });
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        previousCacheHeaders.forEach(([name, value]) => { if (value) response.headers.set(name, value); });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}
