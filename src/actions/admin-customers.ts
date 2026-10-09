"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export async function saveAdminCustomer(_state: { status: string }, form: FormData) {
  const access = await getAdminAccess();
  if (access.status !== "authorized" || access.role !== "admin") return { status: "forbidden" };
  const result = z.object({ id: z.uuid(), updatedAt: z.iso.datetime({ offset: true }), name: z.string().trim().min(1).max(160), phone: z.string().trim().max(40), locale: z.enum(["sl-SI", "fr-FR", "en-GB"]) }).safeParse(Object.fromEntries(form));
  if (!result.success) return { status: "invalid" };
  const client = await createClient();
  if (!client) return { status: "error" };
  const { id, updatedAt, name, phone, locale } = result.data;
  const { error } = await client.rpc("save_admin_customer", { input_id: id, input_expected_updated_at: updatedAt, input_name: name, input_phone: phone, input_locale: locale });
  if (error) return { status: error.message.includes("customer_conflict") ? "conflict" : "error" };
  revalidatePath("/admin/stranke"); revalidatePath("/admin/narocila"); revalidatePath("/admin/dnevnik");
  return { status: "success" };
}
