import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QuickApplyBadges } from "./QuickApplyBadges";
import { QuickContact, QuickContactBar } from "./QuickContact";

const callback = {
  name: "Oleksandr Kowalenko",
  phone: "+49 176 12345678",
  email: "tel-4917612345678@kurzbewerbung.invalid",
  quickApply: { language: "uk", mode: "callback", callbackWindow: "evening" },
} as const;

describe("QuickContact", () => {
  it("renders tel: and sms: links but no mailto for the placeholder address", () => {
    const html = renderToStaticMarkup(<QuickContact {...callback} />);
    expect(html).toContain('href="tel:+4917612345678"');
    expect(html).toContain('href="sms:+4917612345678"');
    expect(html).not.toContain("mailto:");
    expect(html).toContain("Bitte abends anrufen");
  });

  it("shows no contact links while the identity is anonymized", () => {
    const html = renderToStaticMarkup(
      <QuickContact {...callback} anonymized />,
    );
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("sms:");
    expect(html).toContain("anonymisiert");
    expect(
      renderToStaticMarkup(<QuickContactBar {...callback} anonymized />),
    ).toBe("");
  });

  it("renders the fixed thumb bar only when there is something to tap", () => {
    expect(
      renderToStaticMarkup(
        <QuickContactBar name="X" phone={null} email={null} />,
      ),
    ).toBe("");
    const bar = renderToStaticMarkup(
      <QuickContactBar
        name="Mehmet"
        phone="0170 9876543"
        email="m@example.com"
      />,
    );
    expect(bar).toContain('aria-label="Schnellkontakt"');
    expect(bar).toContain("mailto:m@example.com");
  });
});

describe("QuickApplyBadges", () => {
  it("shows the language in its own script with lang/dir and the mode incl. callback time", () => {
    const html = renderToStaticMarkup(
      <QuickApplyBadges
        info={{ language: "ar", mode: "callback", callbackWindow: "morning" }}
      />,
    );
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("العربية");
    expect(html).toContain("Rückruf gewünscht · morgens");
  });

  it("renders nothing for classic applications", () => {
    expect(renderToStaticMarkup(<QuickApplyBadges info={null} />)).toBe("");
  });
});
