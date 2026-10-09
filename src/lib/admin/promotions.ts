import { z } from "zod";

const nullableInteger = (maximum: number) => z.preprocess(
  (value) => value === "" || value === null || value === undefined ? null : Number(value),
  z.number().int().min(0).max(maximum).nullable(),
);
const optionalDate = z.union([z.literal(""), z.string().datetime({ offset: true })])
  .transform((value) => value || null);

export const promotionSchema = z.object({
  id: z.union([z.literal(""), z.string().uuid()]).transform((value) => value || null),
  codeId: z.union([z.literal(""), z.string().uuid()]).transform((value) => value || null),
  expectedUpdatedAt: z.union([z.literal(""), z.string().datetime({ offset: true })]).transform((value) => value || null),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().int().min(1).max(100_000_000),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,40}$/),
  active: z.boolean(),
  codeActive: z.boolean(),
  startsAt: optionalDate,
  endsAt: optionalDate,
  minimumOrderCents: nullableInteger(100_000_000),
  usageLimit: nullableInteger(1_000_000),
  codeUsageLimit: nullableInteger(1_000_000),
}).superRefine((value, ctx) => {
  if (value.type === "percentage" && value.value > 100) {
    ctx.addIssue({ code: "custom", path: ["value"], message: "Odstotek mora biti med 1 in 100." });
  }
  if (value.startsAt && value.endsAt && Date.parse(value.endsAt) <= Date.parse(value.startsAt)) {
    ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Konec mora biti po začetku." });
  }
  if (value.id && !value.expectedUpdatedAt) {
    ctx.addIssue({ code: "custom", path: ["id"], message: "Osvežite podatke pred urejanjem." });
  }
  if (!value.id && value.codeId) {
    ctx.addIssue({ code: "custom", path: ["codeId"], message: "Neveljavna promocijska koda." });
  }
});

export type AdminPromotion = {
  id: string; name: string; description: string | null; type: string; value: number;
  active: boolean; startsAt: string | null; endsAt: string | null;
  minimumOrderCents: number | null; usageLimit: number | null; usedCount: number;
  updatedAt: string; archivedAt: string | null;
  codes: { id: string; code: string; active: boolean; usageLimit: number | null; usedCount: number }[];
};

export type PromotionActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialPromotionState: PromotionActionState = { status: "idle", message: "" };

export function promotionStatus(promotion: Pick<AdminPromotion, "active" | "startsAt" | "endsAt" | "archivedAt" | "usageLimit" | "usedCount">, now = Date.now()) {
  if (promotion.archivedAt) return "archived";
  if (!promotion.active) return "inactive";
  if (promotion.startsAt && Date.parse(promotion.startsAt) > now) return "scheduled";
  if (promotion.endsAt && Date.parse(promotion.endsAt) <= now) return "expired";
  if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) return "exhausted";
  return "active";
}
