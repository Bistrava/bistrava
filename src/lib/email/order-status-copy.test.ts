import { describe, expect, it } from "vitest";

import { isNotifiedOrderStatus, notifiedOrderStatuses, orderStatusCopy } from "@/lib/email/order-status-copy";
import { orderStatusEmailSchema } from "@/lib/validation/email";

const base = {
  customerName: "Maja Novak", orderReference: "BIS-TEST-0001", orderUrl: "https://bistrava.com/narocilo/BIS-TEST-0001", totalCents: 1987,
  items: [{ name: "Kapljice za merjenje trdote vode", quantity: 1, lineTotalCents: 1987 }],
};

describe("order status e-mails", () => {
  it("notifies the customer for payment details and every later status staff can set", () => {
    expect([...notifiedOrderStatuses]).toEqual(["awaiting_payment", "paid", "processing", "shipped", "completed", "cancelled"]);
    for (const status of ["pending", "refunded", "partially_refunded"]) expect(isNotifiedOrderStatus(status)).toBe(false);
  });

  it("gives every status its own subject, title and next step naming the order", () => {
    const subjects = new Set<string>();
    for (const status of notifiedOrderStatuses) {
      const copy = orderStatusCopy(status, "BIS-TEST-0001");
      expect(copy.subject).toContain("BIS-TEST-0001");
      expect(copy.intro).toContain("BIS-TEST-0001");
      expect(copy.title.length).toBeGreaterThan(5);
      expect(copy.next.length).toBeGreaterThan(20);
      subjects.add(copy.subject);
    }
    expect(subjects.size).toBe(notifiedOrderStatuses.length);
    expect(orderStatusCopy("cancelled", "X").intro).toContain("ne izvajajte plačila");
  });

  it("accepts shipment tracking only with a secure tracking link", () => {
    const shipped = { ...base, status: "shipped", shipment: { carrier: "Pošta Slovenije", trackingNumber: "PS1SI", trackingUrl: "https://sledenje.posta.si/" } };
    expect(orderStatusEmailSchema.safeParse(shipped).success).toBe(true);
    expect(orderStatusEmailSchema.safeParse({ ...shipped, shipment: { ...shipped.shipment, trackingUrl: "http://example.test" } }).success).toBe(false);
    expect(orderStatusEmailSchema.safeParse({ ...base, status: "processing", shipment: null }).success).toBe(true);
    expect(orderStatusEmailSchema.safeParse({ ...base, status: "refunded" }).success).toBe(false);
    expect(orderStatusEmailSchema.safeParse({ ...base, status: "awaiting_payment", paymentUrl: "https://bistrava.com/placilo/BIS-TEST-0001?k=abc" }).success).toBe(true);
    expect(orderStatusEmailSchema.safeParse({ ...base, status: "awaiting_payment", paymentUrl: "http://bistrava.com/placilo" }).success).toBe(false);
  });
});
