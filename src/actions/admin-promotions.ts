"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { promotionSchema, type PromotionActionState } from "@/lib/admin/promotions";
import { z } from "zod";

export async function saveAdminPromotion(_state: PromotionActionState, formData: FormData): Promise<PromotionActionState> {
  const access = await getAdminAccess();
  if (access.status !== "authorized" || access.role !== "admin") {
    return { status: "error", message: "Samo administrator lahko spreminja promocije. / Réservé aux administrateurs." };
  }
  const parsed = promotionSchema.safeParse({
    ...Object.fromEntries(formData), active: formData.get("active") === "on", codeActive: formData.get("codeActive") === "on",
  });
  if (!parsed.success) return { status: "error", message: "Preverite vnesene vrednosti. / Vérifiez les valeurs saisies.", fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  if (!supabase) return { status: "error", message: "Supabase ni povezan. / Supabase indisponible." };
  const value = parsed.data;
  const { error } = await supabase.rpc("save_admin_promotion", { input_promotion: {
    id: value.id, code_id: value.codeId, expected_updated_at: value.expectedUpdatedAt,
    name: value.name, description: value.description || null, discount_type: value.type, value: value.value,
    code: value.code, active: value.active, code_active: value.codeActive,
    starts_at: value.startsAt, ends_at: value.endsAt, minimum_order_cents: value.minimumOrderCents,
    usage_limit: value.usageLimit, code_usage_limit: value.codeUsageLimit,
  } });
  if (error) {
    const detail = error.message;
    const message = detail.includes("promotion_conflict") ? "Podatki so se spremenili. Osvežite stran. / Les données ont changé. Actualisez la page."
      : error.code === "23505" || detail.includes("code_duplicate") ? "Ta koda že obstaja. / Ce code existe déjà."
      : detail.includes("usage_limit_below_used") ? "Omejitev ne sme biti nižja od uporabe. / La limite doit couvrir les utilisations existantes."
      : "Promocije ni bilo mogoče shraniti. / Impossible d’enregistrer la promotion.";
    return { status: "error", message };
  }
  revalidatePath("/admin/promocije");
  revalidatePath("/admin");
  return { status: "success", message: "Promocija je shranjena. / Promotion enregistrée." };
}

export async function archiveAdminPromotion(id: string, expectedUpdatedAt: string): Promise<PromotionActionState> {
  const access = await getAdminAccess();
  if (access.status !== "authorized" || access.role !== "admin") return { status: "error", message: "Samo administrator. / Réservé aux administrateurs." };
  const parsed = z.object({ id: z.string().uuid(), expectedUpdatedAt: z.string().datetime({ offset: true }) }).safeParse({ id, expectedUpdatedAt });
  if (!parsed.success) return { status: "error", message: "Neveljavni podatki. / Données invalides." };
  const supabase = await createClient();
  if (!supabase) return { status: "error", message: "Supabase ni povezan. / Supabase indisponible." };
  const { error } = await supabase.rpc("archive_admin_promotion", { input_id: id, input_expected_updated_at: expectedUpdatedAt });
  if (error) return { status: "error", message: "Arhiviranje ni uspelo. Osvežite stran. / Archivage impossible. Actualisez la page." };
  revalidatePath("/admin/promocije");
  revalidatePath("/admin");
  return { status: "success", message: "Promocija je arhivirana. / Promotion archivée." };
}
