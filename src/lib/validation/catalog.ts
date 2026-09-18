import { z } from "zod";

import { moneyInCentsSchema } from "@/lib/commerce/money";

export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-safe.");

export const skuSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[A-Z0-9][A-Z0-9._-]*$/, "SKU format is invalid.");

export const productDraftSchema = z
  .object({
    name: z.string().trim().min(2).max(180),
    slug: slugSchema,
    brand: z.string().trim().min(1).max(120),
    sku: skuSchema,
    gtin: z.string().regex(/^\d{8,14}$/).optional(),
    mpn: z.string().trim().min(1).max(100).optional(),
    shortDescription: z.string().trim().min(20).max(320),
    priceCents: moneyInCentsSchema,
    compareAtPriceCents: moneyInCentsSchema.optional(),
    currency: z.literal("EUR"),
    stockQuantity: z.number().int().nonnegative().optional(),
  })
  .superRefine((product, context) => {
    if (
      product.compareAtPriceCents !== undefined &&
      product.compareAtPriceCents <= product.priceCents
    ) {
      context.addIssue({
        code: "custom",
        path: ["compareAtPriceCents"],
        message: "Compare-at price must be greater than the current price.",
      });
    }
  });

export const cartLineSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});
