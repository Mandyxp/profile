export type FragmentItem = {
  id: string;
  label: string;
  accent: string;
  tone: string;
  status: string;
};

export type ArchiveItem = {
  id: string;
  label: string;
  kind: "file" | "folder" | "corrupt" | "unknown";
  summary: string;
  secret?: string;
};

export const siteConfig = {
  accentColor: "#c4d4b6",
  alternateAccentColor: "#d2c7b8",
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED !== "false",
    adminPassword: process.env.ADMIN_PASSWORD ?? "xp-admin",
    sessionToken: process.env.ADMIN_SESSION_TOKEN ?? "xp-session-token",
    rateLimitWindowMs: 60_000,
    maxEventsPerWindow: 25,
  },
  fragments: [
    { id: "XP_001", label: "FRAGMENT_001.XP", accent: "#b8c9bf", tone: "linear-gradient(135deg, #0b0d0f 0%, #1b1e1d 35%, #c4d4b6 100%)", status: "RECOVERED" },
    { id: "XP_002", label: "FRAGMENT_002.XP", accent: "#c8b8a3", tone: "linear-gradient(135deg, #101214 0%, #181a19 30%, #d2c7b8 100%)", status: "RECOVERED" },
    { id: "XP_003", label: "FRAGMENT_003.XP", accent: "#b7c3d8", tone: "linear-gradient(135deg, #090909 0%, #1b1c1e 40%, #b7c3d8 100%)", status: "RECOVERED" },
  ] as FragmentItem[],
  archiveItems: [
    { id: "001", label: "001", kind: "folder", summary: "SIGNAL / XP_001" },
    { id: "002", label: "002", kind: "folder", summary: "FRAGMENT / RECOVERED" },
    { id: "003", label: "003", kind: "file", summary: "NOISE / EMBEDDED" },
    { id: "UNKNOWN", label: "UNKNOWN", kind: "unknown", summary: "ACCESS DENIED" },
    { id: "CORRUPTED", label: "CORRUPTED", kind: "corrupt", summary: "RECORDING FAILED", secret: "THERE IS SOMETHING BENEATH THE NOISE." },
    { id: "?", label: "?", kind: "unknown", summary: "UNLOCKED BY PATTERN" },
  ] as ArchiveItem[],
  signalMessages: [
    "INTERCEPTED",
    "STILL MOVING",
    "WE ARE HERE",
    "TRACE FOUND",
    "NOT A FILE",
  ],
};
