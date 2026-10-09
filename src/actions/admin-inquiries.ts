"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
export async function saveAdminInquiry(_state: { status: string }, form: FormData) {
  const access = await getAdminAccess();
  if (access.status !== "authorized" || access.role !== "admin") return { status: "error" };
  const parsed = z.object({ id: z.uuid(), updatedAt: z.iso.datetime({ offset: true }), status: z.enum(["new", "in_review", "responded", "closed"]), note: z.string().max(5000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  const client = await createClient(); if (!client) return { status: "error" };
  const value = parsed.data;
  const { error } = await client.rpc("save_admin_inquiry", { input_id: value.id, input_expected_updated_at: value.updatedAt, input_status: value.status, input_note: value.note });
  if (error) return { status: error.message.includes("conflict") ? "conflict" : "error" };
  revalidatePath("/admin/povprasevanja"); revalidatePath("/admin/dnevnik");
  return { status: "success" };
}
