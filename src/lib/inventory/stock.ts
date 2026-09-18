import { z } from "zod";

export const stockQuantitySchema = z.number().int().nonnegative();
export const stockDeltaSchema = z.number().int().min(-1_000_000).max(1_000_000);

export function applyStockDelta(currentQuantity: number, delta: number) {
  const current = stockQuantitySchema.parse(currentQuantity);
  const change = stockDeltaSchema.parse(delta);
  const nextQuantity = current + change;

  if (nextQuantity < 0) {
    throw new Error("Inventory cannot become negative.");
  }

  return nextQuantity;
}

export function assertStockAvailable(available: number, requested: number) {
  const stock = stockQuantitySchema.parse(available);
  const quantity = z.number().int().min(1).max(99).parse(requested);

  if (quantity > stock) {
    throw new Error("Requested quantity exceeds available inventory.");
  }
}
