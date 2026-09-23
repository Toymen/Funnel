import { describe, expect, it } from "vitest";

import { browserFunnelEventSchema, normalizeSource } from "./events";

describe("normalizeSource", () => {
  it("maps known sources and QR codes", () => {
    expect(normalizeSource("Instagram", "social")).toBe("instagram");
    expect(normalizeSource("fb", undefined)).toBe("facebook");
    expect(normalizeSource("lkw", "qr")).toBe("qr");
    expect(normalizeSource(undefined, undefined)).toBe("direkt");
  });

  it("cleans unknown sources", () => {
    expect(normalizeSource("Tik Tok!", undefined)).toBe("tiktok");
    expect(normalizeSource("!!!", undefined)).toBe("sonstige");
  });
});

describe("browserFunnelEventSchema", () => {
  const base = { eventType: "job_view", sessionId: "d548fde2-0b4c-4f7e-9e0a-2b8f4e1f6a11" };

  it("accepts anonymous events", () => {
    expect(browserFunnelEventSchema.safeParse({ ...base, utmSource: "" }).success).toBe(true);
  });

  it("rejects server-only events and oversized metadata", () => {
    expect(browserFunnelEventSchema.safeParse({ ...base, eventType: "hired" }).success).toBe(false);
    const metadata = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`k${i}`, i]));
    expect(browserFunnelEventSchema.safeParse({ ...base, metadata }).success).toBe(false);
  });
});
