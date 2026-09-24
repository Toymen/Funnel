import { describe, expect, it } from "vitest";

import { placeholderEmailForPhone } from "@/features/quick-apply/schema";

import {
  contactActions,
  contactEmail,
  dialableNumber,
  languageLabel,
  modeLabel,
  parseQuickApply,
} from "./quick-contact";

describe("parseQuickApply", () => {
  it("reads language, mode and callback window from the snapshot", () => {
    expect(
      parseQuickApply({
        language: "uk",
        mode: "callback",
        callbackWindow: "evening",
        utmMedium: "qr",
      }),
    ).toEqual({
      language: "uk",
      mode: "callback",
      callbackWindow: "evening",
    });
  });

  it("returns null for classic applications and garbage", () => {
    expect(parseQuickApply(undefined)).toBeNull();
    expect(parseQuickApply(null)).toBeNull();
    expect(parseQuickApply("quick")).toBeNull();
    expect(parseQuickApply([])).toBeNull();
    expect(parseQuickApply({})).toBeNull();
    expect(parseQuickApply({ language: "xx", mode: "fax" })).toBeNull();
  });

  it("drops unknown fields but keeps valid ones", () => {
    expect(
      parseQuickApply({
        language: "pl",
        mode: "unknown",
        callbackWindow: "never",
      }),
    ).toEqual({
      language: "pl",
      mode: null,
      callbackWindow: null,
    });
  });
});

describe("labels", () => {
  it("uses the language's own name from quick-apply/languages", () => {
    expect(languageLabel("uk")).toBe("Українська");
    expect(languageLabel("de-easy")).toBe("Leichte Sprache");
  });

  it("adds the callback window to the callback mode badge", () => {
    expect(modeLabel({ mode: "callback", callbackWindow: "evening" })).toBe(
      "Rückruf gewünscht · abends",
    );
    expect(modeLabel({ mode: "callback", callbackWindow: null })).toBe(
      "Rückruf gewünscht",
    );
    expect(modeLabel({ mode: "voice", callbackWindow: "morning" })).toBe(
      "Sprachnachricht",
    );
    expect(modeLabel({ mode: null, callbackWindow: null })).toBeNull();
  });
});

describe("dialableNumber", () => {
  it("strips formatting and keeps a leading +", () => {
    expect(dialableNumber("+49 (176) 123-456 78")).toBe("+4917612345678");
    expect(dialableNumber("0151 3557243")).toBe("01513557243");
    expect(dialableNumber("06232/12 34.56")).toBe("06232123456");
  });

  it("turns 00 into +", () => {
    expect(dialableNumber("0048 601 234 567")).toBe("+48601234567");
  });

  it("rejects empty and implausible numbers", () => {
    expect(dialableNumber(null)).toBeNull();
    expect(dialableNumber("   ")).toBeNull();
    expect(dialableNumber("112")).toBeNull();
    expect(dialableNumber("12345678901234567890")).toBeNull();
  });
});

describe("contactEmail", () => {
  it("never returns the placeholder address of phone-only quick applications", () => {
    expect(contactEmail(placeholderEmailForPhone("0151 3557243"))).toBeNull();
    expect(contactEmail("TEL-491513557243@KURZBEWERBUNG.INVALID")).toBeNull();
  });

  it("keeps real addresses and rejects malformed ones", () => {
    expect(contactEmail(" katarzyna@example.org ")).toBe(
      "katarzyna@example.org",
    );
    expect(contactEmail("kein-at-zeichen")).toBeNull();
    expect(contactEmail("")).toBeNull();
  });
});

describe("contactActions", () => {
  const kinds = (input: Parameters<typeof contactActions>[0]) =>
    contactActions(input).map((a) => a.kind);

  it("phone-only quick application: call + SMS, no mail to the placeholder", () => {
    const actions = contactActions({
      name: "Anna",
      phone: "0151 3557243",
      email: placeholderEmailForPhone("0151 3557243"),
      quickApply: { language: "de", mode: "quick", callbackWindow: null },
    });
    expect(actions.map((a) => a.kind)).toEqual(["call", "sms"]);
    expect(actions[0]).toMatchObject({
      href: "tel:01513557243",
      label: "Anrufen",
      primary: true,
    });
    expect(actions[1]).toMatchObject({
      href: "sms:01513557243",
      label: "SMS",
      primary: false,
    });
    expect(actions.some((a) => a.href.includes("kurzbewerbung.invalid"))).toBe(
      false,
    );
  });

  it("callback request: calling is the primary action", () => {
    const actions = contactActions({
      name: "Oleksandr",
      phone: "+49 176 12345678",
      email: "tel-4917612345678@kurzbewerbung.invalid",
      quickApply: {
        language: "uk",
        mode: "callback",
        callbackWindow: "evening",
      },
    });
    expect(actions.find((a) => a.primary)?.href).toBe("tel:+4917612345678");
  });

  it("phone and real email: call, SMS and mail", () => {
    expect(
      kinds({
        name: "Mehmet",
        phone: "0170 9876543",
        email: "mehmet@example.com",
      }),
    ).toEqual(["call", "sms", "email"]);
  });

  it("email only: mail becomes the primary action", () => {
    const actions = contactActions({
      name: "Katarzyna",
      phone: null,
      email: "katarzyna@example.org",
    });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      kind: "email",
      href: "mailto:katarzyna@example.org",
      primary: true,
    });
  });

  it("no usable contact data: no actions", () => {
    expect(
      kinds({
        name: "X",
        phone: "",
        email: placeholderEmailForPhone("0151 1"),
      }),
    ).toEqual([]);
  });

  it("names the person in the accessible label", () => {
    const [call, sms] = contactActions({
      name: "Anna",
      phone: "0151 3557243",
      email: null,
    });
    expect(call?.ariaLabel).toBe("Anna anrufen");
    expect(sms?.ariaLabel).toBe("SMS an Anna schreiben");
  });
});
