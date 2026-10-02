import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");

  if (password !== siteConfig.analytics.adminPassword) {
    return NextResponse.redirect(new URL("/admin?error=invalid", request.url));
  }

  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set("xp_admin_token", siteConfig.analytics.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}
