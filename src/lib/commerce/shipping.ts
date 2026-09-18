import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ShippingRate = {
  id: string;
  name: string;
  priceCents: number;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
};

export async function getActiveShippingRates(): Promise<ShippingRate[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("shipping_rates")
    .select("id,name,price_cents,estimated_days_min,estimated_days_max,shipping_zones!inner(country_codes,active)")
    .eq("active", true)
    .eq("shipping_zones.active", true)
    .order("price_cents", { ascending: true });

  if (error || !data) return [];
  return data.flatMap((rate) => {
    const zone = Array.isArray(rate.shipping_zones)
      ? rate.shipping_zones[0]
      : rate.shipping_zones;
    if (!zone || !Array.isArray(zone.country_codes) || !zone.country_codes.includes("SI")) {
      return [];
    }
    return [{
      id: String(rate.id),
      name: String(rate.name),
      priceCents: Number(rate.price_cents),
      estimatedDaysMin: rate.estimated_days_min === null ? null : Number(rate.estimated_days_min),
      estimatedDaysMax: rate.estimated_days_max === null ? null : Number(rate.estimated_days_max),
    }];
  });
}
