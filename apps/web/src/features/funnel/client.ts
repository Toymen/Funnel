"use client";

import type { BrowserFunnelEvent } from "./events";

const SESSION_KEY = "bs_funnel_session";
const UTM_KEY = "bs_funnel_utm";

type Utm = { utmSource?: string; utmMedium?: string; utmCampaign?: string };

function safeStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Zufällige Session-ID pro Browser-Tab (sessionStorage). Kein Cookie, kein
 * Fingerprinting – nach dem Schließen des Tabs ist sie weg (PRD v2 §9.2).
 */
export function funnelSessionId(): string {
  const storage = safeStorage();
  const existing = storage?.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage?.setItem(SESSION_KEY, id);
  return id;
}

/** Übernimmt utm_* aus der URL beim ersten Aufruf und merkt sie für den Tab. */
export function funnelUtm(): Utm {
  const storage = safeStorage();
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Utm = {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  };
  if (fromUrl.utmSource || fromUrl.utmMedium || fromUrl.utmCampaign) {
    storage?.setItem(UTM_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }
  try {
    return JSON.parse(storage?.getItem(UTM_KEY) ?? "{}") as Utm;
  } catch {
    return {};
  }
}

/**
 * Sendet ein Funnel-Ereignis per sendBeacon (überlebt Seitenwechsel) bzw.
 * fetch/keepalive. Fehler werden verschluckt – Tracking stört nie.
 */
export function trackFunnel(
  eventType: BrowserFunnelEvent,
  data: { jobId?: string; metadata?: Record<string, string | number | boolean> } = {},
): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      eventType,
      sessionId: funnelSessionId(),
      ...funnelUtm(),
      ...data,
    });
    const url = "/api/public/funnel";
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.(url, blob)) {
      void fetch(url, { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  } catch {
    // Tracking darf die Bewerbung nie blockieren.
  }
}
