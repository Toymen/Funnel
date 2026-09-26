import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { describe, expect, it } from "vitest";

describe("next-intl in Tests", () => {
  it("liefert englische Texte für Server-Code", async () => {
    const t = await getTranslations("common.actions");
    expect(t("save")).toBe("Save");
    const t2 = await getTranslations({
      locale: "de",
      namespace: "common.roles",
    });
    expect(t2("hiring_manager")).toBe("Hiring manager");
    expect(await getLocale()).toBe("en");
  });

  it("formatiert Daten in der festen Zeitzone", async () => {
    const format = await getFormatter();
    expect(
      format.dateTime(new Date("2026-09-26T22:30:00Z"), {
        dateStyle: "medium",
      }),
    ).toBe("Sep 27, 2026");
  });
});
