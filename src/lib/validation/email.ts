import { z } from "zod";

export const emailRecipientSchema = z.string().trim().toLowerCase().email().max(254);

export const orderConfirmationEmailSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  orderReference: z.string().trim().min(3).max(40),
  orderUrl: z.string().url(),
  totalCents: z.number().int().nonnegative(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(180),
        quantity: z.number().int().min(1).max(99),
        lineTotalCents: z.number().int().nonnegative(),
      }),
    )
    .min(1)
    .max(100),
});

export type OrderConfirmationEmailData = z.infer<
  typeof orderConfirmationEmailSchema
>;
