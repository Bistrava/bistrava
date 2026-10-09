import { describe, expect, it } from "vitest";
import { promotionSchema, promotionStatus } from "./promotions";

const valid = { id: "", codeId: "", expectedUpdatedAt: "", name: "Autumn offer", description: "", type: "percentage", value: "10", code: " jeseni10 ", active: false, codeActive: true, startsAt: "", endsAt: "", minimumOrderCents: "", usageLimit: "", codeUsageLimit: "" };

describe("administrative promotion validation", () => {
  it("normalizes the code and preserves inactive campaigns without inventing limits", () => {
    const parsed = promotionSchema.parse(valid);
    expect(parsed.code).toBe("JESENI10");
    expect(parsed.active).toBe(false);
    expect(parsed.usageLimit).toBeNull();
    expect(parsed.minimumOrderCents).toBeNull();
  });
  it("rejects zero, fractional and over-100 percentages and negative limits", () => {
    for (const value of [0, 10.5, 101, -1]) expect(promotionSchema.safeParse({ ...valid, value }).success).toBe(false);
    expect(promotionSchema.safeParse({ ...valid, usageLimit: -1 }).success).toBe(false);
    expect(promotionSchema.parse({ ...valid, usageLimit: 0 }).usageLimit).toBe(0);
  });
  it("accepts fixed amounts in integer cents and rejects reverse validity intervals", () => {
    expect(promotionSchema.parse({ ...valid, type: "fixed", value: 1299 }).value).toBe(1299);
    expect(promotionSchema.safeParse({ ...valid, startsAt: "2026-10-10T10:00:00+02:00", endsAt: "2026-10-10T08:00:00Z" }).success).toBe(false);
  });
  it("requires the version timestamp for updates and disallows attaching an existing code to a new campaign", () => {
    const id = "10000000-0000-4000-8000-000000000001";
    expect(promotionSchema.safeParse({ ...valid, id }).success).toBe(false);
    expect(promotionSchema.safeParse({ ...valid, codeId: id }).success).toBe(false);
    expect(promotionSchema.safeParse({ ...valid, id, expectedUpdatedAt: "2026-10-08T10:00:00Z" }).success).toBe(true);
  });
});

describe("promotion availability labels", () => {
  const now = Date.parse("2026-10-08T12:00:00Z");
  const campaign = { active: true, archivedAt: null, startsAt: null, endsAt: null, usageLimit: 10, usedCount: 2 };
  it("handles inclusive start, exclusive end and exhausted quotas", () => {
    expect(promotionStatus({ ...campaign, startsAt: "2026-10-08T12:00:00Z" }, now)).toBe("active");
    expect(promotionStatus({ ...campaign, endsAt: "2026-10-08T12:00:00Z" }, now)).toBe("expired");
    expect(promotionStatus({ ...campaign, startsAt: "2026-10-09T00:00:00Z" }, now)).toBe("scheduled");
    expect(promotionStatus({ ...campaign, usedCount: 10 }, now)).toBe("exhausted");
    expect(promotionStatus({ ...campaign, archivedAt: "2026-10-08T11:00:00Z" }, now)).toBe("archived");
  });
});
