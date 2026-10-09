import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ShippingRate } from "@/lib/commerce/shipping-rates";
export type { ShippingRate } from "@/lib/commerce/shipping-rates";

export async function getActiveShippingRates(): Promise<ShippingRate[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("shipping_rates")
    .select("id,name,price_cents,min_order_cents,max_order_cents,estimated_days_min,estimated_days_max,shipping_zones!inner(country_codes,postal_code_patterns,active)")
    .eq("active", true)
    .eq("currency", "EUR")
    .eq("shipping_zones.active", true)
    .order("price_cents", { ascending: true });

  if (error || !data) return [];
  return data.flatMap((rate) => {
    const zone = Array.isArray(rate.shipping_zones)
      ? rate.shipping_zones[0]
      : rate.shipping_zones;
    if (!zone || !Array.isArray(zone.country_codes) || zone.country_codes.length !== 1 || zone.country_codes[0] !== "SI" || (zone.postal_code_patterns?.length ?? 0) > 0) {
      return [];
    }
    return [{
      id: String(rate.id),
      name: String(rate.name),
      priceCents: Number(rate.price_cents),
      minOrderCents: rate.min_order_cents === null ? null : Number(rate.min_order_cents),
      maxOrderCents: rate.max_order_cents === null ? null : Number(rate.max_order_cents),
      estimatedDaysMin: rate.estimated_days_min === null ? null : Number(rate.estimated_days_min),
      estimatedDaysMax: rate.estimated_days_max === null ? null : Number(rate.estimated_days_max),
    }];
  });
}
