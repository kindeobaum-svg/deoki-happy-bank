import { NextResponse } from "next/server";
import { COOKIE_NAME, clearSessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", clearSessionCookieOptions());
  return response;
}
