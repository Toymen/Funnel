import { describe, expect, it } from "vitest";

import { biggestDropOff, computeFunnel, percent, stageKeyForPipelineStage } from "./metrics";

describe("percent", () => {
  it("rounds to one decimal and guards division by zero", () => {
    expect(percent(250, 1000)).toBe(25);
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(5, 0)).toBeNull();
  });
});

describe("computeFunnel", () => {
  // Beispiel aus PRD v1 §46
  const stages = computeFunnel({
    job_view: 1000,
    application_started: 250,
    application_submitted: 150,
    interview: 40,
    offer: 10,
    hired: 7,
  });

  it("computes step conversion", () => {
    expect(stages[0]).toMatchObject({ key: "job_view", fromPrevious: null, fromStart: null });
    expect(stages[1]?.fromPrevious).toBe(25);
    expect(stages[2]?.fromPrevious).toBe(60);
    expect(stages[5]?.fromPrevious).toBe(70);
  });

  it("computes overall conversion", () => {
    expect(stages[2]?.fromStart).toBe(15);
  });

  it("finds the biggest drop-off (ties → earliest stage)", () => {
    // 25 % bei „begonnen“ und 25 % bei „Angebot“ – die frühere Stufe zählt.
    expect(biggestDropOff(stages)?.key).toBe("application_started");
  });
});

describe("stageKeyForPipelineStage", () => {
  it("maps English and German stage names", () => {
    expect(stageKeyForPipelineStage("Interview")).toBe("interview");
    expect(stageKeyForPipelineStage("Vorstellungsgespräch")).toBe("interview");
    expect(stageKeyForPipelineStage("Offer")).toBe("offer");
    expect(stageKeyForPipelineStage("Eingestellt")).toBe("hired");
    expect(stageKeyForPipelineStage("Screening")).toBeNull();
  });
});
