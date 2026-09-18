import { z } from "zod";

export const contactRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(20).max(4_000),
  consent: z.literal(true),
});

export type ContactRequest = z.infer<typeof contactRequestSchema>;
