import { describe, expect, it } from "vitest";

import { companyDetails, companyPostalAddress, companyReturnsAddress } from "@/lib/content/company";
import { legalPages } from "@/lib/content/legal-pages";

describe("public seller information", () => {
  it("names the same seller and registered office in the legal notice, terms and privacy policy", () => {
    for (const key of ["pravna-obvestila", "splosni-pogoji-poslovanja", "zasebnost"] as const) {
      const content = JSON.stringify(legalPages[key]);
      expect(content).toContain(companyDetails.fullName);
      expect(content).toContain(companyPostalAddress);
      expect(content).toContain(companyDetails.registrationNumber);
      expect(content).toContain(companyDetails.email);
    }
    expect(legalPages.zasebnost.requiresBusinessDetails).toBeUndefined();
    const notice = legalPages["pravna-obvestila"];
    expect(notice.requiresBusinessDetails).toBeUndefined();
    expect(notice.sections.find((section) => section.id === "ponudnik")?.items).toContain("Zakoniti zastopnik: Erika Kozjan");
    expect(JSON.stringify(notice)).not.toContain("[DOPOLNITI]");
  });

  it("publishes the confirmed returns address and the choice not to recognize an IRPS provider", () => {
    const returns = legalPages.vracila.sections.find((section) => section.id === "naslov");
    const irps = legalPages["splosni-pogoji-poslovanja"].sections.find((section) => section.id === "irps");

    expect(returns?.callout).toContain(`Naslov za vračila: PUREH2O d.o.o., ${companyReturnsAddress}`);
    expect(companyDetails.returnsAddress).not.toBe(companyDetails.registeredOffice);
    expect(companyReturnsAddress).toBe("Srebrniče 18A, 8000 Novo mesto, Slovenija");
    expect(JSON.stringify(legalPages.vracila)).not.toContain("[DOPOLNITI]");
    expect(legalPages.vracila.requiresBusinessDetails).toBeUndefined();
    expect(irps?.paragraphs[0]).toContain("ne priznava nobenega izvajalca izvensodnega reševanja potrošniških sporov (IRPS)");
    expect(irps?.callout).toBeUndefined();
    expect(legalPages["splosni-pogoji-poslovanja"].requiresBusinessDetails).toBeUndefined();
    expect(JSON.stringify(legalPages["splosni-pogoji-poslovanja"])).not.toContain("[DOPOLNITI]");
    expect(legalPages["pravna-obvestila"].sections.find((section) => section.id === "irps")?.paragraphs).toEqual(irps?.paragraphs.slice(0, 1));
  });

  it("keeps the statutory 14-day withdrawal and the seller-paid return of unused goods", () => {
    const returns = JSON.stringify(legalPages.vracila);
    expect(legalPages.vracila.highlights?.map((highlight) => highlight.value)).toEqual(["14 dni", "Krije Bistrava", "V 14 dneh", "2 leti"]);
    expect(returns).toContain("Bistrava krije neposredni strošek vračila, če je izdelek vrnjen nerabljen, popoln in v stanju, v katerem je bil dostavljen");
    expect(returns).toContain("odstop od pogodbe ostane veljaven");
    expect(returns).toContain("najpozneje v 14 dneh od prejema obvestila o odstopu");
    expect(returns).toContain("se pokaže v dveh letih od dobave");
    expect(returns).not.toMatch(/7 dni|7 dneh/);
    expect(JSON.stringify(legalPages["splosni-pogoji-poslovanja"])).toContain("Neposredni strošek vračila nerabljenega in popolnega izdelka v stanju ob dobavi krije ponudnik.");
  });

  it("names Hostinger as the only web host", () => {
    const content = JSON.stringify(legalPages);
    expect(JSON.stringify(legalPages["pravna-obvestila"])).toContain("Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaka, Ciper");
    expect(JSON.stringify(legalPages.zasebnost)).toContain("Hostinger International Ltd.");
    expect(content).not.toMatch(/Render|Vercel/);
  });

  it("describes the bank transfer launch without claiming card processing or a future payment provider", () => {
    const payments = JSON.stringify(legalPages.placila);
    const privacy = JSON.stringify(legalPages.zasebnost);
    expect(payments).toContain("plačilo s kartico (Mastercard, Visa in druge plačilne kartice) prek plačilnega sistema Stripe, kadar je omogočeno na blagajni");
    expect(payments).toContain("Ti podatki ne prehajajo prek strežnikov Bistrave in jih Bistrava ne hrani");
    expect(payments).toContain("plačilo po povzetju trenutno ni na voljo");
    expect(privacy).toContain("banke pri izvedbi nakazila");
    expect(privacy).not.toContain("prihodnji ponudnik plačil");
    expect(privacy).toContain("Stripe Payments Europe, Limited (Irska)");
    expect(payments).toContain("1–2 delovnih dneh po potrjenem prejemu celotnega bančnega nakazila");
    expect(payments).toContain("dodatnih 1–3 delovnih dni po odpremi");
    expect(payments).toContain("Bančni podatki niso prikazani na blagajni ali potrditveni strani");
    expect(payments).toContain("dokončno potrjeno ob prejemu potrdila o nakazilu");
  });
});
