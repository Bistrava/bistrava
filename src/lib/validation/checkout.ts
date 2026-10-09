import { z } from "zod";

const checkoutCartLineSchema = z.object({
  sku: z.string().trim().min(2).max(64),
  quantity: z.number().int().min(1).max(99),
});

function parseCart(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export const discountCodeSchema = z.string().trim().toUpperCase().max(40)
  .refine((value) => value === "" || /^[A-Z0-9_-]{3,40}$/.test(value), "Preverite promocijsko kodo.");

export const checkoutQuoteSchema = z.object({
  cart: z.preprocess(parseCart, z.array(checkoutCartLineSchema).min(1).max(100)),
  shippingRateId: z.string().uuid(),
  discountCode: discountCodeSchema,
});

export type CheckoutQuoteState = {
  status: "success" | "error";
  message: string;
  quote?: { subtotalCents: number; shippingCents: number; discountCents: number; totalCents: number; code: string | null };
};

export const checkoutFormSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(6).max(40),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  company: z.string().trim().max(120).optional().default(""),
  addressLine1: z.string().trim().min(3).max(160),
  addressLine2: z.string().trim().max(160).optional().default(""),
  postalCode: z.string().trim().regex(/^\d{4}$/, "Vnesite štirimestno poštno številko."),
  city: z.string().trim().min(2).max(100),
  countryCode: z.literal("SI"),
  shippingRateId: z.string().uuid(),
  customerNote: z.string().trim().max(1000).optional().default(""),
  termsAccepted: z.literal("on", { error: "Potrdite pogoje naročila." }),
  website: z.string().max(0).optional().default(""),
  idempotencyKey: z.string().uuid(),
  guestToken: z.string().min(32).max(200),
  discountCode: discountCodeSchema.optional().default(""),
  expectedTotalCents: z.coerce.number().int().min(0).max(100_000_000),
  discountAcknowledged: z.string().optional().default(""),
  cart: z.preprocess(parseCart, z.array(checkoutCartLineSchema).min(1).max(100)),
}).refine((value) => !value.discountCode || value.discountAcknowledged === "on", {
  path: ["discountAcknowledged"], message: "Potrdite končni znesek s popustom.",
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
