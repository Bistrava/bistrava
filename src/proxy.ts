import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Next.js discovers Proxy beside src/app. This refreshes sessions only;
// every admin page and server action still checks its own authorization.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
