import { getAdminAccess } from "@/lib/auth/admin";
import { adminNotificationsSchema } from "@/lib/admin/notifications";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Vary": "Cookie",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function GET() {
  try {
    const access = await getAdminAccess();
    if (access.status !== "authorized") {
      return Response.json({ error: "unauthorized" }, { status: access.status === "forbidden" ? 403 : 401, headers });
    }
    const client = await createClient();
    if (!client) return Response.json({ error: "unavailable" }, { status: 503, headers });

    const { data, error } = await client.rpc("get_admin_notifications");
    const parsed = adminNotificationsSchema.safeParse(data);
    if (error || !parsed.success) {
      return Response.json({ error: "unavailable" }, { status: 503, headers });
    }
    return Response.json(parsed.data, { headers });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}
