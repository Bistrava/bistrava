import { z } from "zod";

export const inquiryTypes = [
  "contact",
  "quote",
  "installation",
  "service",
  "advice",
  "configurator",
] as const;

export const inquiryFieldConstraints = {
  name: { minLength: 2, maxLength: 120 },
  email: { maxLength: 254 },
  phone: { maxLength: 40 },
  message: { minLength: 10, maxLength: 4000 },
  municipality: { maxLength: 120 },
  postalCode: { maxLength: 12 },
} as const;

const optionalShortText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || null);

export const inquiryFormSchema = z.object({
  type: z.enum(inquiryTypes),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: optionalShortText(40),
  municipality: optionalShortText(120),
  postalCode: optionalShortText(12),
  message: z.string().trim().min(10).max(4000),
  productSlug: optionalShortText(180),
  payload: z.string().max(12_000).optional().default("{}"),
  consent: z.literal("on"),
  website: z.string().max(0).optional().default(""),
  utmSource: optionalShortText(180),
  utmMedium: optionalShortText(180),
  utmCampaign: optionalShortText(180),
  utmTerm: optionalShortText(180),
  utmContent: optionalShortText(180),
});

export type InquiryFormInput = z.infer<typeof inquiryFormSchema>;
