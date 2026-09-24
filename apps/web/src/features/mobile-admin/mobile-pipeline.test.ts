import { describe, expect, it } from "vitest";

import {
  columnIndexForScroll,
  isTerminalStageName,
  moveConfirmationMessage,
} from "./mobile-pipeline";

describe("mobile pipeline helpers", () => {
  it("recognises decision stages in German and English", () => {
    expect(isTerminalStageName("Abgesagt")).toBe(true);
    expect(isTerminalStageName(" eingestellt ")).toBe(true);
    expect(isTerminalStageName("Rejected")).toBe(true);
    expect(isTerminalStageName("Prüfung")).toBe(false);
  });

  it("builds a German confirmation text", () => {
    expect(moveConfirmationMessage("Anna", "Abgesagt")).toBe(
      "Anna wirklich nach „Abgesagt“ verschieben?",
    );
  });

  it("maps scroll position to the visible column, clamped", () => {
    expect(columnIndexForScroll(0, 300, 7)).toBe(0);
    expect(columnIndexForScroll(290, 300, 7)).toBe(1);
    expect(columnIndexForScroll(-610, 300, 7)).toBe(2); // RTL: negative scrollLeft
    expect(columnIndexForScroll(99999, 300, 7)).toBe(6);
    expect(columnIndexForScroll(100, 0, 7)).toBe(0);
    expect(columnIndexForScroll(100, 300, 0)).toBe(0);
  });
});
