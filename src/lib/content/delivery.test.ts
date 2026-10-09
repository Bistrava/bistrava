import { describe, expect, it } from "vitest";
import { createDeliveryPageContent } from "@/lib/content/delivery";
import type { ShippingRate } from "@/lib/commerce/shipping";

const rates: ShippingRate[] = [
  { id: "paid", name: "Standardna dostava", priceCents: 450, minOrderCents: null, maxOrderCents: 8000, estimatedDaysMin: null, estimatedDaysMax: null },
  { id: "free", name: "Brezplačna dostava", priceCents: 0, minOrderCents: 8001, maxOrderCents: null, estimatedDaysMin: null, estimatedDaysMax: null },
];

describe("public delivery policy", () => {
  it("shows the exact inclusive paid limit and strictly greater free threshold", () => {
    const page = createDeliveryPageContent(rates);
    const rows = page.sections[0].table!.rows.map((row) => row.map((cell) => cell.replace(/\u00a0/g, " ")));
    expect(rows[0]).toEqual(["Do 80,00 € (vključno)", "Standardna dostava", "4,50 €"]);
    expect(rows[1]).toEqual(["Nad 80,00 € (od 80,01 €)", "Brezplačna dostava", "Brezplačno"]);
    expect(page.sections[0].callout).toContain("pred uporabo promocijske kode");
    expect(page.sections.find((section) => section.id === "rok")?.items).toBeUndefined();
  });

  it("reflects administrator changes instead of keeping the launch price in static text", () => {
    const page = createDeliveryPageContent([{ ...rates[0], name: "Posodobljena dostava", priceCents: 650, maxOrderCents: null }]);
    expect(page.sections[0].table?.rows[0][0]).toBe("Vsa naročila");
    expect(page.sections[0].table?.rows[0][2].replace(/\u00a0/g, " ")).toBe("6,50 €");
    expect(JSON.stringify(page)).not.toContain("80,00");
    expect(JSON.stringify(page)).not.toContain("4,50");
  });

  it("does not promise a delivery tariff when none is available", () => {
    const page = createDeliveryPageContent([]);
    expect(page.sections[0].table).toBeUndefined();
    expect(page.sections[0].paragraphs[0]).toContain("trenutno ni na voljo");
  });
});
