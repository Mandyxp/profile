import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type AnalyticsEvent = {
  id: string;
  time: string;
  visitor: string;
  referrer: string;
  section: string;
  page: string;
  device: string;
  browser: string;
  platform: string;
  region: string;
  session: string;
};

const analyticsPath = path.join(process.cwd(), "data", "analytics.json");

function normalizeText(value: unknown, fallback = "-") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text.slice(0, 180) : fallback;
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function getForwardedIp(value: string | null | undefined) {
  if (!value) return "unknown";
  return value.split(",")[0].trim();
}

function getVisitorKey(headers: Headers) {
  const ip = getForwardedIp(headers.get("x-forwarded-for") ?? headers.get("cf-connecting-ip"));
  const ua = headers.get("user-agent") ?? "unknown";
  const salt = process.env.ANALYTICS_SALT ?? "xp-salt";
  return hashValue(`${ip}:${ua}:${salt}`);
}

export async function ensureAnalyticsStore() {
  const dir = path.dirname(analyticsPath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(analyticsPath);
  } catch {
    await fs.writeFile(
      analyticsPath,
      JSON.stringify({ createdAt: new Date().toISOString(), events: [] }, null, 2),
    );
  }
}

export async function readAnalyticsStore() {
  await ensureAnalyticsStore();
  const raw = await fs.readFile(analyticsPath, "utf8");
  const parsed = JSON.parse(raw || '{"events":[]}');
  return parsed as { events: AnalyticsEvent[] };
}

export async function recordAnalyticsEntry(input: Partial<AnalyticsEvent> & { headers?: Headers }) {
  if (process.env.ANALYTICS_ENABLED === "false") {
    return;
  }

  const headers = input.headers ?? new Headers();
  const store = await readAnalyticsStore();
  const region = normalizeText(
    headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? "unknown",
  );

  const entry: AnalyticsEvent = {
    id: createHash("sha256").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 16),
    time: new Date().toISOString(),
    visitor: getVisitorKey(headers),
    referrer: normalizeText(input.referrer ?? headers.get("referer") ?? "direct"),
    section: normalizeText(input.section ?? "boot"),
    page: normalizeText(input.page ?? "/"),
    device: normalizeText(input.device ?? "unknown"),
    browser: normalizeText(input.browser ?? "unknown"),
    platform: normalizeText(input.platform ?? "unknown"),
    region,
    session: normalizeText(input.session ?? "unknown"),
  };

  store.events.push(entry);
  await fs.writeFile(analyticsPath, JSON.stringify(store, null, 2));
}

export function summarizeAnalytics(events: AnalyticsEvent[]) {
  const uniqueVisitors = new Set(events.map((event) => event.visitor));
  const visits = events.length;
  const sections = new Map<string, number>();

  events.forEach((event) => {
    sections.set(event.section, (sections.get(event.section) ?? 0) + 1);
  });

  const deviceBreakdown = new Map<string, number>();
  events.forEach((event) => {
    deviceBreakdown.set(event.device, (deviceBreakdown.get(event.device) ?? 0) + 1);
  });

  const referrers = new Map<string, number>();
  events.forEach((event) => {
    referrers.set(event.referrer, (referrers.get(event.referrer) ?? 0) + 1);
  });

  return {
    visits,
    uniqueVisitors: uniqueVisitors.size,
    sections: Array.from(sections.entries()).sort((a, b) => b[1] - a[1]),
    devices: Array.from(deviceBreakdown.entries()).sort((a, b) => b[1] - a[1]),
    referrers: Array.from(referrers.entries()).sort((a, b) => b[1] - a[1]),
  };
}
