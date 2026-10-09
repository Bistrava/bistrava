import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccess } from "@/lib/auth/admin";
import { guideContentSchema, type AdminGuide } from "@/lib/admin/guide-editor";
import { guides, type Guide } from "@/lib/content/guides";

function mapGuide(row: Record<string, unknown>): AdminGuide | null {
  const parsed = guideContentSchema.safeParse(row.content);
  if (!parsed.success) return null;
  if (!["draft", "published", "archived"].includes(String(row.status))) return null;
  return {
    id: String(row.id), slug: String(row.slug), title: String(row.title), excerpt: String(row.excerpt),
    status: row.status as Guide["status"], updatedAt: String(row.updated_at).slice(0, 10), version: String(row.updated_at),
    seoTitle: typeof row.seo_title === "string" ? row.seo_title : "", seoDescription: typeof row.seo_description === "string" ? row.seo_description : "",
    ...parsed.data,
  };
}

const columns = "id,title,slug,excerpt,content,status,seo_title,seo_description,updated_at";

export const getPublishedGuides = cache(async (): Promise<Guide[]> => {
  const supabase = await createClient();
  if (!supabase) return guides.filter((guide) => guide.status === "published");
  const { data, error } = await supabase.from("guides").select(columns)
    .eq("status", "published").is("archived_at", null).lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false }).order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.flatMap((row) => { const guide = mapGuide(row); return guide ? [guide] : []; });
});

export const getPublishedGuide = cache(async (slug: string): Promise<AdminGuide | Guide | null> => {
  const supabase = await createClient();
  if (!supabase) return guides.find((guide) => guide.slug === slug && guide.status === "published") ?? null;
  const { data, error } = await supabase.from("guides").select(columns).eq("slug", slug)
    .eq("status", "published").is("archived_at", null).lte("published_at", new Date().toISOString()).maybeSingle();
  return error || !data ? null : mapGuide(data);
});

export async function getAdminGuides(): Promise<{ source: "live" | "unavailable"; guides: AdminGuide[] }> {
  const access = await getAdminAccess();
  if (access.status !== "authorized") return { source: "unavailable", guides: [] };
  const supabase = await createClient();
  if (!supabase) return { source: "unavailable", guides: [] };
  const { data, error } = await supabase.from("guides").select(columns).order("updated_at", { ascending: false });
  if (error || !data) return { source: "unavailable", guides: [] };
  return { source: "live", guides: data.flatMap((row) => { const guide = mapGuide(row); return guide ? [guide] : []; }) };
}
