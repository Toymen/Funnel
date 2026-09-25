import { describe, expect, it } from "vitest";

import { PRIMARY_QUICK_APPLY_LANGUAGES, QUICK_APPLY_LANGUAGES, suggestLanguage } from "./languages";
import { format, QUICK_APPLY_MESSAGES } from "./messages";
import { isPlaceholderEmail, placeholderEmailForPhone, quickApplicationSchema } from "./schema";

const base = {
  jobSlug: "lkw-fahrer",
  sessionId: "d548fde2-0b4c-4f7e-9e0a-2b8f4e1f6a11",
  language: "pl",
  mode: "quick",
  firstName: "Anna",
  consent: true,
} as const;

describe("quickApplicationSchema (PRD §5.1 Minimal-Pflicht)", () => {
  it("accepts first name + phone only", () => {
    expect(quickApplicationSchema.safeParse({ ...base, phone: "0151 1234567" }).success).toBe(true);
  });
  it("accepts first name + email only, ignores empty strings", () => {
    const r = quickApplicationSchema.safeParse({ ...base, email: "anna@example.de", phone: "" });
    expect(r.success).toBe(true);
  });
  it("rejects missing contact, missing consent and callback without phone", () => {
    expect(quickApplicationSchema.safeParse(base).success).toBe(false);
    expect(quickApplicationSchema.safeParse({ ...base, phone: "0151 1234567", consent: false }).success).toBe(false);
    expect(quickApplicationSchema.safeParse({ ...base, mode: "callback", email: "a@b.de" }).success).toBe(false);
  });
});

describe("placeholder email", () => {
  it("is stable per phone number and never deliverable", () => {
    expect(placeholderEmailForPhone("0151 123-4567")).toBe("tel-491511234567@kurzbewerbung.invalid");
    expect(placeholderEmailForPhone("+49 151 1234567")).toBe("tel-491511234567@kurzbewerbung.invalid");
    expect(isPlaceholderEmail("tel-1@kurzbewerbung.invalid")).toBe(true);
  });
});

describe("languages (PRD §5.3)", () => {
  it("has messages for every language with the same keys", () => {
    const keys = Object.keys(QUICK_APPLY_MESSAGES.de).sort();
    for (const { code } of QUICK_APPLY_LANGUAGES) {
      expect(Object.keys(QUICK_APPLY_MESSAGES[code]).sort()).toEqual(keys);
      for (const value of Object.values(QUICK_APPLY_MESSAGES[code])) expect(value.trim()).not.toBe("");
    }
  });
  it("suggests a language from Accept-Language, never Leichte Sprache", () => {
    expect(suggestLanguage("pl-PL,pl;q=0.9,en;q=0.8")).toBe("pl");
    expect(suggestLanguage("ar;q=0.5,fr;q=0.9")).toBe("ar");
    expect(suggestLanguage("tr;q=0,en;q=0.8")).toBe("en");
    expect(suggestLanguage("fr-FR")).toBe("de");
    expect(suggestLanguage(null)).toBe("de");
  });
  it("puts the five primary RLP languages first without removing accessible alternatives", () => {
    expect(PRIMARY_QUICK_APPLY_LANGUAGES.map(({ code }) => code)).toEqual(["de", "en", "tr", "ar", "uk"]);
    expect(QUICK_APPLY_LANGUAGES.map(({ code }) => code)).toContain("de-easy");
  });
  it("formats placeholders", () => {
    expect(format("Schritt {current} von {total}", { current: 2, total: 4 })).toBe("Schritt 2 von 4");
  });
});
