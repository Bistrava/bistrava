import { describe, expect, it } from "vitest";

import { inquiryFormSchema } from "@/lib/validation/inquiry";

const valid = {
  type: "quote",
  name: "Maja Novak",
  email: "maja@example.si",
  phone: "",
  municipality: "Ljubljana",
  postalCode: "1000",
  message: "Prosim za pregled pogojev za mehčalec vode.",
  productSlug: "",
  payload: "{}",
  consent: "on",
  website: "",
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "mehka-voda",
  utmTerm: "",
  utmContent: "",
};

describe("inquiryFormSchema", () => {
  it("accepts a valid consented request", () => {
    expect(inquiryFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing consent and short messages", () => {
    const result = inquiryFormSchema.safeParse({
      ...valid,
      consent: undefined,
      message: "Premalo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(
      inquiryFormSchema.safeParse({ ...valid, website: "spam.example" }).success,
    ).toBe(false);
  });
});
