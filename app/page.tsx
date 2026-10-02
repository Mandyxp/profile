import type { Metadata } from "next";
import { XpShell } from "@/components/xp-shell";

export const metadata: Metadata = {
  title: ".XP",
  description: "Unknown archive.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: ".XP",
    description: "Unknown archive.",
  },
};

export default function Home() {
  return <XpShell />;
}
