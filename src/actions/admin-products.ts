"use server";

import { revalidatePath } from "next/cache";

import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { adminProductFormSchema } from "@/lib/validation/admin-product";

export type AdminProductActionState = {
  status: "idle" | "success" | "error";
  message: string;
  redirectUrl?: `/admin/izdelki/${string}`;
  fieldErrors?: Record<string, string[]>;
};

export const initialAdminProductActionState: AdminProductActionState = {
  status: "idle",
  message: "",
};

export async function saveAdminProduct(
  _previousState: AdminProductActionState,
  formData: FormData,
): Promise<AdminProductActionState> {
  const isFrench = formData.get("adminLocale") === "fr";
  const parsed = adminProductFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: isFrench
        ? "Vérifiez les champs signalés avant d’enregistrer."
        : "Pred shranjevanjem preverite označena polja.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    return {
      status: "error",
      message: isFrench
        ? "Votre session d’administration n’est plus valide."
        : "Vaša skrbniška seja ni več veljavna.",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      status: "error",
      message: isFrench
        ? "Supabase n’est pas encore connecté."
        : "Supabase še ni povezan.",
    };
  }

  const { data: before, error: readError } = await supabase
    .from("products")
    .select(
      "id,slug,status,published_at,product_images(id),product_documents(id)",
    )
    .eq("slug", parsed.data.currentSlug)
    .maybeSingle();

  if (readError || !before) {
    return {
      status: "error",
      message: isFrench
        ? "Le produit est introuvable dans Supabase."
        : "Izdelka v Supabase ni bilo mogoče najti.",
    };
  }

  if (parsed.data.status === "active") {
    const activationReady =
      parsed.data.priceEuros !== null &&
      parsed.data.stockStatus !== "unverified" &&
      parsed.data.leadTimeDays !== null &&
      parsed.data.warrantyMonths !== null &&
      parsed.data.technicalSpecifications.length > 0 &&
      Array.isArray(before.product_images) &&
      before.product_images.length > 0;

    if (!activationReady) {
      return {
        status: "error",
        message: isFrench
          ? "Activation bloquée : complétez le prix, le stock public, le délai, la garantie, les caractéristiques et au moins une image."
          : "Aktivacija je blokirana: dopolnite ceno, javno zalogo, dobavni rok, garancijo, lastnosti in vsaj eno sliko.",
      };
    }
  }

  const seoKeywords = Array.from(
    new Set(
      [
        parsed.data.primaryKeyword,
        ...parsed.data.secondaryKeywords,
        ...parsed.data.longTailKeywords,
      ].filter(Boolean),
    ),
  );
  const now = new Date().toISOString();
  const update = {
    name: parsed.data.nameSl,
    name_sl: parsed.data.nameSl,
    slug: parsed.data.slug,
    brand: parsed.data.brand,
    sku: parsed.data.sku,
    technology: parsed.data.technology || null,
    status: parsed.data.status,
    sales_mode: parsed.data.salesMode,
    featured: parsed.data.featured,
    short_description: parsed.data.shortDescriptionSl,
    short_description_sl: parsed.data.shortDescriptionSl,
    description: parsed.data.descriptionSl,
    description_sl: parsed.data.descriptionSl,
    benefits: parsed.data.highlights,
    seo_title: parsed.data.seoTitle,
    seo_description: parsed.data.seoDescriptionSl,
    primary_keyword: parsed.data.primaryKeyword || null,
    secondary_keywords: parsed.data.secondaryKeywords,
    long_tail_keywords: parsed.data.longTailKeywords,
    seo_keywords: seoKeywords,
    tags: parsed.data.tags,
    price_cents: parsed.data.priceEuros,
    compare_at_price_cents: parsed.data.compareAtPriceEuros,
    vat_rate: parsed.data.vatRate ?? 22,
    stock_status: parsed.data.stockStatus,
    stock_quantity: parsed.data.stockQuantity ?? 0,
    lead_time_days: parsed.data.leadTimeDays,
    warranty_months: parsed.data.warrantyMonths,
    household_size_min: parsed.data.householdSizeMin,
    household_size_max: parsed.data.householdSizeMax,
    resin_volume_liters: parsed.data.resinVolumeLiters,
    nominal_flow_lpm: parsed.data.nominalFlowLitersPerMinute,
    max_flow_lpm: parsed.data.maxFlowLitersPerMinute,
    connection_size: parsed.data.connectionSize || null,
    regeneration_mode: parsed.data.regenerationMode || null,
    salt_consumption_kg: parsed.data.saltConsumptionKg,
    dimensions: parsed.data.dimensions || null,
    weight_kg: parsed.data.weightKg,
    drain_required: parsed.data.drainRequired,
    electricity_required: parsed.data.electricityRequired,
    bypass_included: parsed.data.bypassIncluded,
    installation_required: parsed.data.installationRequired,
    technical_specs: parsed.data.technicalSpecifications,
    certifications: parsed.data.certifications,
    published_at:
      parsed.data.status === "active" ? before.published_at ?? now : null,
    archived_at: parsed.data.status === "archived" ? now : null,
    updated_at: now,
  };

  const { error: updateError } = await supabase
    .from("products")
    .update(update)
    .eq("id", before.id);

  if (updateError) {
    return {
      status: "error",
      message: isFrench
        ? "Le produit n’a pas pu être enregistré en toute sécurité."
        : "Izdelka ni bilo mogoče varno shraniti.",
    };
  }

  await supabase.from("audit_logs").insert({
    actor_id: access.userId,
    action: "product.updated",
    entity_type: "product",
    entity_id: before.id,
    before_data: before,
    after_data: update,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/izdelki");
  revalidatePath(`/admin/izdelki/${parsed.data.currentSlug}`);
  revalidatePath(`/izdelki/${parsed.data.currentSlug}`);
  if (parsed.data.slug !== parsed.data.currentSlug) {
    revalidatePath(`/admin/izdelki/${parsed.data.slug}`);
    revalidatePath(`/izdelki/${parsed.data.slug}`);
  }

  return {
    status: "success",
    message: isFrench
      ? "Produit enregistré dans Supabase."
      : "Izdelek je shranjen v Supabase.",
    redirectUrl:
      parsed.data.slug === parsed.data.currentSlug
        ? undefined
        : `/admin/izdelki/${parsed.data.slug}`,
  };
}
