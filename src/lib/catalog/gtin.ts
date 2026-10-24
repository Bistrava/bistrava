/** GTIN-8, UPC (GTIN-12), EAN (GTIN-13) or GTIN-14 with a valid GS1 check digit. */
export function isValidGtin(value: string) {
  if (!/^(\d{8}|\d{12,14})$/.test(value)) return false;
  const digits = [...value].map(Number);
  const checkDigit = digits.pop()!;
  // From the right, positions before the check digit alternate weights 3 and 1.
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === checkDigit;
}

export function normalizeGtin(value: string | null | undefined) {
  const compact = (value ?? "").replace(/[\s-]/g, "");
  return compact && isValidGtin(compact) ? compact : null;
}
