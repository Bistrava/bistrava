import { z } from "zod";

import { slugSchema, skuSchema } from "@/lib/validation/catalog";

const optionalNumber = (minimum = 0) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || Number.isFinite(Number(value.replace(",", "."))),
      "Vnesite veljavno številko.",
    )
    .transform((value) =>
      value === "" ? null : Number(value.replace(",", ".")),
    )
    .refine((value) => value === null || value >= minimum, "Vrednost je prenizka.");

const optionalInteger = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d+$/.test(value),
    "Vnesite celo število.",
  )
  .transform((value) => (value === "" ? null : Number(value)));

const optionalMoney = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d+(?:[.,]\d{1,2})?$/.test(value),
    "Cena mora imeti največ dve decimalki.",
  )
  .transform((value) =>
    value === "" ? null : Math.round(Number(value.replace(",", ".")) * 100),
  );

const textList = (maximum: number) =>
  z
    .string()
    .max(5000)
    .transform((value) =>
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .refine((items) => items.length <= maximum, `Največ ${maximum} vnosov.`);

const technicalSpecifications = z
  .string()
  .max(12000)
  .transform((value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  )
  .refine(
    (lines) => lines.every((line) => line.includes("|")),
    "Vsaka vrstica mora biti zapisana kot oznaka | vrednost.",
  )
  .transform((lines) =>
    lines.map((line) => {
      const [labelSl, ...valueParts] = line.split("|");
      return { labelSl: labelSl.trim(), valueSl: valueParts.join("|").trim() };
    }),
  )
  .refine(
    (items) => items.every((item) => item.labelSl && item.valueSl),
    "Oznaka in vrednost ne smeta biti prazni.",
  );

const optionalBoolean = z.enum(["", "true", "false"]).transform((value) =>
  value === "" ? null : value === "true",
);

export const adminProductFormSchema = z
  .object({
    currentSlug: slugSchema,
    nameSl: z.string().trim().min(2).max(180),
    slug: slugSchema,
    brand: z.string().trim().min(1).max(120),
    sku: skuSchema,
    technology: z.string().trim().max(240),
    status: z.enum(["draft", "active", "archived"]),
    salesMode: z.enum(["buy_now", "quote", "installation_required"]),
    featured: z.enum(["false", "true"]).transform((value) => value === "true"),
    shortDescriptionSl: z.string().trim().min(20).max(500),
    descriptionSl: z.string().trim().min(80).max(12000),
    highlights: textList(20),
    seoTitle: z.string().trim().min(10).max(70),
    seoDescriptionSl: z.string().trim().min(50).max(180),
    primaryKeyword: z.string().trim().max(120),
    secondaryKeywords: textList(25),
    longTailKeywords: textList(25),
    tags: textList(30),
    priceEuros: optionalMoney,
    compareAtPriceEuros: optionalMoney,
    vatRate: optionalNumber(0),
    stockStatus: z.enum(["in_stock", "out_of_stock", "backorder", "unverified"]),
    stockQuantity: optionalInteger,
    leadTimeDays: optionalInteger,
    warrantyMonths: optionalInteger,
    householdSizeMin: optionalInteger,
    householdSizeMax: optionalInteger,
    resinVolumeLiters: optionalNumber(),
    nominalFlowLitersPerMinute: optionalNumber(),
    maxFlowLitersPerMinute: optionalNumber(),
    connectionSize: z.string().trim().max(120),
    regenerationMode: z.string().trim().max(180),
    saltConsumptionKg: optionalNumber(),
    dimensions: z.string().trim().max(180),
    weightKg: optionalNumber(),
    drainRequired: optionalBoolean,
    electricityRequired: optionalBoolean,
    bypassIncluded: optionalBoolean,
    installationRequired: z.enum(["false", "true"]).transform((value) => value === "true"),
    technicalSpecifications,
    certifications: textList(30),
  })
  .superRefine((product, context) => {
    if (
      product.compareAtPriceEuros !== null &&
      (product.priceEuros === null || product.compareAtPriceEuros <= product.priceEuros)
    ) {
      context.addIssue({
        code: "custom",
        path: ["compareAtPriceEuros"],
        message: "Primerjalna cena mora biti višja od prodajne cene.",
      });
    }
    if (
      product.householdSizeMin !== null &&
      product.householdSizeMax !== null &&
      product.householdSizeMax < product.householdSizeMin
    ) {
      context.addIssue({
        code: "custom",
        path: ["householdSizeMax"],
        message: "Največje gospodinjstvo ne sme biti manjše od najmanjšega.",
      });
    }
    if (product.vatRate !== null && product.vatRate > 100) {
      context.addIssue({
        code: "custom",
        path: ["vatRate"],
        message: "DDV mora biti med 0 in 100.",
      });
    }
    if (
      (product.primaryKeyword ? 1 : 0) +
        product.secondaryKeywords.length +
        product.longTailKeywords.length >
      40
    ) {
      context.addIssue({
        code: "custom",
        path: ["secondaryKeywords"],
        message: "Skupaj je dovoljenih največ 40 SEO ključnih besed.",
      });
    }
  });

export type AdminProductFormInput = z.input<typeof adminProductFormSchema>;
export type AdminProductFormData = z.output<typeof adminProductFormSchema>;
