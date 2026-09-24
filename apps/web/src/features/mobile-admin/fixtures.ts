/**
 * Beispieldaten für Stories und Tests der HR-Handy-Ansicht (keine echten Personen).
 */
export const callbackContact = {
  name: "Oleksandr Kowalenko",
  phone: "+49 176 12345678",
  email: "tel-4917612345678@kurzbewerbung.invalid",
  quickApply: { language: "uk", mode: "callback", callbackWindow: "evening" },
} as const;

export const voiceContact = {
  name: "Mehmet Yılmaz",
  phone: "0170 9876543",
  email: "mehmet.yilmaz@example.com",
  quickApply: { language: "tr", mode: "voice", callbackWindow: null },
} as const;

export const emailOnlyContact = {
  name: "Katarzyna Nowak",
  phone: null,
  email: "katarzyna.nowak@example.org",
  quickApply: { language: "pl", mode: "quick", callbackWindow: null },
} as const;

export const classicContact = {
  name: "Maximiliane-Theresa von Hohenberg-Schwarzenfeld",
  phone: "06232 123456",
  email: "maximiliane.theresa.von.hohenberg@sehr-lange-domain-beispiel.example",
  quickApply: null,
} as const;
