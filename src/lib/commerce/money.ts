import { z } from "zod";

export const moneyInCentsSchema = z
  .number()
  .int("Amount must be an integer number of cents.")
  .nonnegative("Amount cannot be negative.")
  .max(100_000_000, "Amount exceeds the supported limit.");

export function formatMoney(amountCents: number, currency = "EUR") {
  moneyInCentsSchema.parse(amountCents);

  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function calculateLineTotal(unitPriceCents: number, quantity: number) {
  moneyInCentsSchema.parse(unitPriceCents);
  const validQuantity = z.number().int().min(1).max(999).parse(quantity);
  const total = unitPriceCents * validQuantity;

  if (!Number.isSafeInteger(total)) {
    throw new Error("Calculated line total exceeds safe integer limits.");
  }

  return total;
}

export function calculateCartTotal(
  lines: Array<{ unitPriceCents: number; quantity: number }>,
) {
  return lines.reduce(
    (total, line) => total + calculateLineTotal(line.unitPriceCents, line.quantity),
    0,
  );
}
