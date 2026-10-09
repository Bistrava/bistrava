"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { adminGuideSchema, guideReadingTime, type AdminGuideActionState } from "@/lib/admin/guide-editor";

export async function saveAdminGuide(_previous: AdminGuideActionState, form: FormData): Promise<AdminGuideActionState> {
  const fr = form.get("adminLocale") === "fr";
  const access = await getAdminAccess();
  if (access.status !== "authorized" || access.role !== "admin") return { status: "error", message: fr ? "Session administrateur requise." : "Potrebna je skrbniška seja." };
  const parsed = adminGuideSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", message: fr ? "Complétez le titre, l’extrait et chaque section. Vérifiez les colonnes du tableau." : "Izpolnite naslov, povzetek in vsako poglavje. Preverite stolpce tabele." };
  const supabase = await createClient();
  if (!supabase) return { status: "error", message: fr ? "Supabase indisponible." : "Supabase ni na voljo." };
  const value = parsed.data;
  const { data, error } = await supabase.rpc("save_admin_guide", {
    input_id: value.id || null, input_expected_updated_at: value.expectedUpdatedAt || null,
    input_title: value.title, input_slug: value.slug, input_excerpt: value.excerpt,
    input_content: { ...value.content, readingTime: guideReadingTime(value.content) },
    input_status: value.status, input_seo_title: value.seoTitle, input_seo_description: value.seoDescription,
  });
  if (error || !data) return { status: "error", message: error?.message.includes("guide_conflict") ? fr ? "Le guide a été modifié. Actualisez la page avant de réessayer." : "Vodnik je bil spremenjen. Osvežite stran in poskusite znova." : error?.code === "23505" ? fr ? "Cette adresse est déjà utilisée par un autre guide." : "Ta naslov že uporablja drug vodnik." : fr ? "Le guide n’a pas pu être enregistré." : "Vodnika ni bilo mogoče shraniti." };
  for (const path of ["/admin", "/admin/vodici", "/vodici", "/sitemap.xml", "/"]) revalidatePath(path);
  revalidatePath(`/admin/vodici/${data}`);
  revalidatePath(`/vodici/${value.slug}`);
  redirect(`/admin/vodici/${data}?saved=1`);
}
