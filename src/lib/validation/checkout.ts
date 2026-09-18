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
  cart: z.preprocess(parseCart, z.array(checkoutCartLineSchema).min(1).max(100)),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

