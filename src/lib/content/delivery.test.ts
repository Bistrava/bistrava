import { describe, expect, it } from "vitest";
import { createDeliveryPageContent, productDeliveryEstimate, productDeliveryFacts } from "@/lib/content/delivery";
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
    expect(page.sections.find((section) => section.id === "rok")?.items).toEqual([
      "Standardna dostava: predvidoma 1–3 delovnih dni po odpremi (brez časa priprave naročila).",
      "Brezplačna dostava: predvidoma 1–3 delovnih dni po odpremi (brez časa priprave naročila).",
    ]);
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

  it("separates preparation after confirmed bank payment from subsequent transport", () => {
    const page = createDeliveryPageContent(rates);
    const timing = page.sections.find((section) => section.id === "rok")!;
    expect(timing.paragraphs[0]).toContain("1–2 delovnih dneh po potrjenem prejemu celotnega bančnega nakazila");
    expect(timing.paragraphs[1]).toContain("dodatnih 1–3 delovnih dni po odpremi");
    expect(timing.paragraphs[1]).toContain("ne vključuje časa bančne obdelave ali priprave naročila");
  });

  it("prices delivery of one product with the inclusive paid limit and the free threshold", () => {
    const facts = (priceCents: number) => {
      const result = productDeliveryFacts(productDeliveryEstimate(rates, priceCents));
      return { ...result, cost: result.cost.replace(/ /g, " "), freeShipping: result.freeShipping?.replace(/ /g, " ") ?? null };
    };
    expect(facts(8000)).toEqual({
      cost: "4,50 € z DDV po Sloveniji",
      freeShipping: "Brezplačna dostava za naročila nad 80,00 €",
      timing: "Priprava v 1–2 delovnih dneh po prejemu plačila, nato prevoz traja 1–3 delovne dni",
    });
    expect(facts(8001)).toMatchObject({ cost: "Brezplačna dostava po Sloveniji", freeShipping: null });
  });

  it("describes product delivery without a tariff when no rate is configured", () => {
    const estimate = productDeliveryEstimate([], 1990);
    expect(estimate).toMatchObject({ rate: null, freeShippingFromCents: null, handlingDaysMin: 1, handlingDaysMax: 2, transitDaysMin: 1, transitDaysMax: 3 });
    expect(productDeliveryFacts(estimate)).toMatchObject({ cost: "Strošek prikažemo v košarici", freeShipping: null });
  });

  it("uses a complete configured shipping estimate instead of the default without mutating rates", () => {
    const customRates = [{ ...rates[0], estimatedDaysMin: 5, estimatedDaysMax: 7 }];
    const page = createDeliveryPageContent(customRates);
    expect(page.sections.find((section) => section.id === "rok")?.items).toEqual([
      "Standardna dostava: predvidoma 5–7 delovnih dni po odpremi (brez časa priprave naročila).",
    ]);
    expect(customRates[0].estimatedDaysMin).toBe(5);
    expect(customRates[0].estimatedDaysMax).toBe(7);
    expect(rates[0].estimatedDaysMin).toBeNull();
  });
});
