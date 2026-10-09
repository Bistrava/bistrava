"use server";

import { getAdminAccess } from "@/lib/auth/admin";
import { markAdminNotificationsSchema } from "@/lib/admin/notifications";
import { createClient } from "@/lib/supabase/server";

export async function markAdminNotificationsRead(
  category: unknown,
  entityIds: unknown,
): Promise<{ status: "success" | "error" }> {
  const input = markAdminNotificationsSchema.safeParse({ category, entityIds });
  if (!input.success) return { status: "error" };

  try {
    const access = await getAdminAccess();
    if (access.status !== "authorized") return { status: "error" };
    const client = await createClient();
    if (!client) return { status: "error" };

    // Identity is derived from the authenticated database session, never input.
    // Only the rendered snapshot is acknowledged, so later arrivals stay unread.
    const { error } = await client.rpc("mark_admin_notifications_read", {
      input_category: input.data.category,
      input_entity_ids: [...new Set(input.data.entityIds)],
    });
    return { status: error ? "error" : "success" };
  } catch {
    return { status: "error" };
  }
}
