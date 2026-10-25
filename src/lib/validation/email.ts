import { z } from "zod";
import { bankTransferSchema } from '@/lib/payments/bank-transfer';
import { notifiedOrderStatuses } from "@/lib/email/order-status-copy";

export const emailRecipientSchema = z.string().trim().toLowerCase().email().max(254);

export const orderConfirmationEmailSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  orderReference: z.string().trim().min(3).max(40),
  orderUrl: z.string().url(),
  totalCents: z.number().int().nonnegative(),
  bankTransfer:bankTransferSchema.optional(),
  cardPaid: z.boolean().optional(),
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

export const orderStatusEmailSchema = orderConfirmationEmailSchema.pick({
  customerName: true, orderReference: true, orderUrl: true, totalCents: true, items: true,
}).extend({
  status: z.enum(notifiedOrderStatuses),
  /** Signed card payment link, sent with the "awaiting_payment" e-mail of card orders. */
  paymentUrl: z.string().url().startsWith("https://").nullable().optional(),
  shipment: z.object({
    carrier: z.string().trim().min(1).max(120),
    trackingNumber: z.string().trim().min(1).max(200),
    trackingUrl: z.string().url().startsWith("https://").nullable(),
  }).nullable().optional(),
});

export type OrderStatusEmailData = z.infer<typeof orderStatusEmailSchema>;
