import { describe, expect, it } from "vitest";

import { negotiateLocale } from "./config";
import { MESSAGE_NAMESPACES, MESSAGES } from "./messages";

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [k, v] of leaves(value, path)) out.set(k, v);
  }
  return out;
}

/** Namen der ICU-Platzhalter, z. B. {count} oder {name, select, …}. */
function placeholders(message: string): string[] {
  return [...message.matchAll(/\{\s*([A-Za-z_][\w]*)\s*(?:[,}])/g)]
    .map((m) => m[1] ?? "")
    .sort();
}

const de = leaves(MESSAGES.de);
const en = leaves(MESSAGES.en);

describe("Übersetzungen des Arbeitgeberbereichs", () => {
  it("hat für jeden Bereich eine deutsche und eine englische Datei", () => {
    for (const ns of MESSAGE_NAMESPACES) {
      expect(MESSAGES.de[ns], ns).toBeTypeOf("object");
      expect(MESSAGES.en[ns], ns).toBeTypeOf("object");
    }
  });

  it("enthält auf Deutsch genau die Schlüssel wie auf Englisch", () => {
    const missingInDe = [...en.keys()].filter((k) => !de.has(k));
    const missingInEn = [...de.keys()].filter((k) => !en.has(k));
    expect(missingInDe, "fehlt auf Deutsch").toEqual([]);
    expect(missingInEn, "fehlt auf Englisch").toEqual([]);
  });

  it("hat keine leeren Texte", () => {
    const empty = [...de, ...en]
      .filter(([, v]) => v.trim() === "")
      .map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it("nutzt in beiden Sprachen dieselben Platzhalter", () => {
    const mismatched = [...en.entries()]
      .filter(([key, value]) => {
        const other = de.get(key);
        return (
          other !== undefined &&
          placeholders(other).join() !== placeholders(value).join()
        );
      })
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });
});

describe("negotiateLocale", () => {
  it.each([
    [undefined, "de"],
    ["", "de"],
    ["en-GB,en;q=0.9", "en"],
    ["de-AT,de;q=0.9,en;q=0.8", "de"],
    ["fr-FR,fr;q=0.9,en;q=0.5", "en"],
    ["fr-FR,fr;q=0.9", "de"],
    ["en;q=0.4,de;q=0.8", "de"],
    ["en;q=0,de;q=0", "de"],
  ])("%s → %s", (header, expected) => {
    expect(negotiateLocale(header)).toBe(expected);
  });
});
