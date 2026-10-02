import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEntry } from "@/lib/analytics";

const rateLimit = new Map<string, number[]>();

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return `${forwarded}:${userAgent}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const key = getClientKey(request);
    const now = Date.now();
    const entries = rateLimit.get(key) ?? [];
    const recent = entries.filter((time) => now - time < 60_000);

    if (recent.length >= 10) {
      return NextResponse.json({ ok: true, rateLimited: true });
    }

    recent.push(now);
    rateLimit.set(key, recent);

    await recordAnalyticsEntry({
      ...body,
      headers: request.headers,
      page: typeof body.page === "string" ? body.page : "/",
      section: typeof body.section === "string" ? body.section : "boot",
      device: typeof body.device === "string" ? body.device : "unknown",
      browser: typeof body.browser === "string" ? body.browser : "unknown",
      platform: typeof body.platform === "string" ? body.platform : "unknown",
      referrer: typeof body.referrer === "string" ? body.referrer : "direct",
      session: typeof body.session === "string" ? body.session : "unknown",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
