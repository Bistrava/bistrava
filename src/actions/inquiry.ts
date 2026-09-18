"use server";

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";

import { sendInquiryNotifications } from "@/lib/email/send-inquiry";
import { createAdminClient } from "@/lib/supabase/admin";
import { inquiryFormSchema } from "@/lib/validation/inquiry";

export type InquiryActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialInquiryState: InquiryActionState = {
  status: "idle",
  message: "",
};

type RateEntry = { count: number; resetAt: number };
const globalRateStore = globalThis as typeof globalThis & {
  bistravaInquiryRateStore?: Map<string, RateEntry>;
};
const rateStore =
  globalRateStore.bistravaInquiryRateStore ?? new Map<string, RateEntry>();
globalRateStore.bistravaInquiryRateStore = rateStore;

function isRateLimited(key: string) {
  const now = Date.now();
  const current = rateStore.get(key);
  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return false;
  }
  if (current.count >= 5) return true;
  current.count += 1;
  return false;
}

function parsePayload(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function submitInquiry(
  _previousState: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  const raw = Object.fromEntries(formData);
  const result = inquiryFormSchema.safeParse(raw);

  if (!result.success) {
    return {
      status: "error",
      message: "Preverite označena polja in poskusite znova.",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  if (result.data.website) {
    return { status: "success", message: "Hvala. Vaše sporočilo je sprejeto." };
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = createHash("sha256")
    .update(`${process.env.RATE_LIMIT_SALT || "bistrava-local"}:${forwardedFor || "unknown"}`)
    .digest("hex");

  if (isRateLimited(clientKey)) {
    return {
      status: "error",
      message: "Preveč zaporednih poskusov. Poskusite ponovno nekoliko pozneje.",
    };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return {
      status: "error",
      message:
        "Obrazec še ni povezan s podatkovno zbirko. Uporabite kontaktni naslov, ko bo objavljen.",
    };
  }

  const requestId = randomUUID();
  const payload = parsePayload(result.data.payload);
  const attribution = {
    source: result.data.utmSource,
    medium: result.data.utmMedium,
    campaign: result.data.utmCampaign,
    term: result.data.utmTerm,
    content: result.data.utmContent,
  };

  const { error } = await supabase.from("quote_requests").insert({
    id: requestId,
    request_type: result.data.type,
    name: result.data.name,
    email: result.data.email,
    phone: result.data.phone,
    municipality: result.data.municipality,
    postal_code: result.data.postalCode,
    message: result.data.message,
    product_slug: result.data.productSlug,
    result_payload: payload,
    attribution,
    consent_version: "privacy-2026-08-draft",
    consented_at: new Date().toISOString(),
    ip_hash: clientKey,
  });

  if (error) {
    return {
      status: "error",
      message: "Sporočila trenutno ni bilo mogoče varno shraniti. Poskusite znova pozneje.",
    };
  }

  await sendInquiryNotifications({
    requestId,
    type: result.data.type,
    name: result.data.name,
    email: result.data.email,
    phone: result.data.phone,
    message: result.data.message,
  });

  return {
    status: "success",
    message:
      "Hvala. Vaše povpraševanje je varno shranjeno. Če je e-pošta konfigurirana, boste prejeli kopijo sporočila.",
  };
}
