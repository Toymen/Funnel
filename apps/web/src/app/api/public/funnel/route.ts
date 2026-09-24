import { type NextRequest,NextResponse } from "next/server";

import { browserFunnelEventSchema } from "@/features/funnel/events";
import { recordFunnelEvent } from "@/features/funnel/record";
import { clientIp, enforceRateLimit } from "@/server/api/ratelimit";

export const runtime = "nodejs";

/**
 * POST /api/public/funnel – anonymes Funnel-Tracking (PRD v2 §9).
 * Die IP wird nur flüchtig fürs Rate-Limit genutzt und nicht gespeichert.
 */
export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(`public:funnel:${clientIp(request)}`, {
      limit: 120,
      windowMs: 60_000,
    });
  } catch {
    return new NextResponse(null, { status: 429 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = browserFunnelEventSchema.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const recorded = await recordFunnelEvent(parsed.data).catch(() => false);
  return new NextResponse(null, { status: recorded ? 202 : 400 });
}
