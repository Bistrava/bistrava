import { z } from "zod";
import type { Guide } from "@/lib/content/guides";

const paragraph = z.string().trim().min(1).max(10000);
export const guideContentSchema = z.object({
  readingTime: z.string().trim().max(60),
  sections: z.array(z.object({ title: z.string().trim().min(1).max(200), paragraphs: z.array(paragraph).min(1).max(30) })).min(1).max(40),
  comparison: z.object({
    title: z.string().trim().min(1).max(200), caption: z.string().trim().max(500),
    columns: z.array(z.string().trim().min(1).max(150)).min(2).max(6),
    rows: z.array(z.array(z.string().trim().max(1000))).min(1).max(30),
  }).refine((table) => table.rows.every((row) => row.length === table.columns.length), "Every row must match the column count.").nullable(),
});
export const adminGuideSchema = z.object({
  id: z.union([z.string().uuid(), z.literal("")]),
  expectedUpdatedAt: z.union([z.string().datetime({ offset: true }), z.literal("")]),
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  excerpt: z.string().trim().min(15).max(600),
  status: z.enum(["draft", "published", "archived"]),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(300),
  content: z.string().max(250000).transform((value, context) => {
    try { return JSON.parse(value); } catch { context.addIssue({ code: "custom", message: "Invalid content" }); return z.NEVER; }
  }).pipe(guideContentSchema),
}).refine((value) => !value.id || Boolean(value.expectedUpdatedAt));

export type AdminGuide = Guide & { id: string; version: string; seoTitle: string; seoDescription: string };
export type AdminGuideActionState = { status: "idle" | "error"; message: string };
export type GuideContent = z.infer<typeof guideContentSchema>;

export function guideReadingTime(content: Pick<GuideContent, "sections" | "comparison">): string {
  const text = [...content.sections.flatMap((section) => [section.title, ...section.paragraphs]), ...(content.comparison?.rows.flat() ?? [])].join(" ");
  return `${Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 180))} min branja`;
}
