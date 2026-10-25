// Customer-facing wording for each order status that triggers an automatic e-mail.
export const notifiedOrderStatuses = ["paid", "processing", "shipped", "completed", "cancelled"] as const;
export type NotifiedOrderStatus = (typeof notifiedOrderStatuses)[number];

export function isNotifiedOrderStatus(status: string): status is NotifiedOrderStatus {
  return (notifiedOrderStatuses as readonly string[]).includes(status);
}

export function orderStatusCopy(status: NotifiedOrderStatus, reference: string) {
  switch (status) {
    case "paid":
      return {
        subject: `Bistrava — plačilo prejeto ${reference}`,
        title: "Plačilo smo prejeli.",
        badge: "Plačilo prejeto",
        intro: `Potrjujemo prejem plačila za naročilo ${reference}. Naročilo bomo zdaj pripravili za odpremo.`,
        next: "Ko bo paket oddan prevozniku, vam pošljemo podatke za sledenje.",
      };
    case "processing":
      return {
        subject: `Bistrava — naročilo ${reference} je v pripravi`,
        title: "Vaše naročilo je v pripravi.",
        badge: "V pripravi",
        intro: `Naročilo ${reference} pripravljamo za odpremo.`,
        next: "Ko bo paket oddan prevozniku, vam pošljemo podatke za sledenje.",
      };
    case "shipped":
      return {
        subject: `Bistrava — naročilo ${reference} je odpremljeno`,
        title: "Vaše naročilo je na poti.",
        badge: "Odpremljeno",
        intro: `Paket z naročilom ${reference} smo oddali prevozniku.`,
        next: "Dostava po Sloveniji običajno traja 1–3 delovne dni. Stanje pošiljke lahko spremljate s podatki za sledenje.",
      };
    case "completed":
      return {
        subject: `Bistrava — naročilo ${reference} je zaključeno`,
        title: "Naročilo je zaključeno.",
        badge: "Zaključeno",
        intro: `Naročilo ${reference} je dostavljeno in zaključeno. Hvala za zaupanje.`,
        next: "Imate vprašanje o izdelku, montaži ali vračilu? Odgovorite na to sporočilo. Pogoji vračila so objavljeni na bistrava.com/vracila.",
      };
    case "cancelled":
      return {
        subject: `Bistrava — naročilo ${reference} je preklicano`,
        title: "Naročilo je preklicano.",
        badge: "Preklicano",
        intro: `Naročilo ${reference} je preklicano. Zanj ne izvajajte plačila.`,
        next: "Če ste nakazilo že izvedli, odgovorite na to sporočilo, da vam znesek vrnemo. Za novo naročilo smo vam na voljo na bistrava.com.",
      };
  }
}
