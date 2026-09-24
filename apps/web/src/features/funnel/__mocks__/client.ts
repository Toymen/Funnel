/**
 * Storybook-Mock für ../client.ts (per `sb.mock` in .storybook/preview.tsx).
 * Ereignisse werden nur als Spy im Interactions-Panel sichtbar – kein
 * sendBeacon/fetch auf /api/public/funnel.
 */
import { fn } from "storybook/test";

import type { BrowserFunnelEvent } from "../events";

export const funnelSessionId = fn((): string => "storybook-session").mockName("funnelSessionId");

export const funnelUtm = fn((): { utmSource?: string; utmMedium?: string; utmCampaign?: string } => ({})).mockName(
  "funnelUtm",
);

export const trackFunnel = fn(
  (eventType: BrowserFunnelEvent, data?: { jobId?: string; metadata?: Record<string, string | number | boolean> }) => {
    void eventType;
    void data;
  },
).mockName("trackFunnel");
