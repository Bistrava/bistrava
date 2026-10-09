import { describe, expect, it } from "vitest";
import { adminGuideSchema, guideContentSchema, guideReadingTime } from "@/lib/admin/guide-editor";
import { guides } from "@/lib/content/guides";

describe("guide CMS validation", () => {
  it("preserves every existing article including its comparison table", () => {
    expect(guides).toHaveLength(10);
    for (const guide of guides) {
      expect(guideContentSchema.parse({ readingTime: guide.readingTime, sections: guide.sections, comparison: guide.comparison })).toEqual({ readingTime: guide.readingTime, sections: guide.sections, comparison: guide.comparison });
    }
  });
  it("supports paragraph-only guides and rejects incomplete tables", () => {
    const content = { readingTime: "1 min branja", sections: [{ title: "Izbira", paragraphs: ["Preverite kakovost vode pred izbiro filtra."] }], comparison: null };
    expect(guideContentSchema.safeParse(content).success).toBe(true);
    expect(guideContentSchema.safeParse({ ...content, comparison: { title: "Primerjava", caption: "", columns: ["Filter", "Uporaba"], rows: [["Samo ena celica"]] } }).success).toBe(false);
    expect(guideContentSchema.safeParse({ ...content, sections: [{ title: "", paragraphs: [] }] }).success).toBe(false);
    expect(guideReadingTime(content)).toBe("1 min branja");
  });
  it("rejects malformed JSON, unsafe slugs and edits without versions", () => {
    const guide = guides[0];
    const form = { id: "", expectedUpdatedAt: "", title: guide.title, slug: guide.slug, excerpt: guide.excerpt, status: "draft", seoTitle: "", seoDescription: "", content: JSON.stringify(guide) };
    expect(adminGuideSchema.safeParse(form).success).toBe(true);
    expect(adminGuideSchema.safeParse({ ...form, content: "{" }).success).toBe(false);
    expect(adminGuideSchema.safeParse({ ...form, slug: "../../admin" }).success).toBe(false);
    expect(adminGuideSchema.safeParse({ ...form, id: "10000000-0000-4000-8000-000000000001" }).success).toBe(false);
  });
});
