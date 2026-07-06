import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import {
  getHomeForRole,
  getLoginRedirectForPath,
  isPathAllowedForRole,
  normalizePathname,
} from "@/lib/roleAccess";
import { PARENT_HOME_PATH } from "@/lib/parentHomePath";

const PUBLIC_PATHS = ["/login", "/manifest.webmanifest", "/sw.js", "/icons"];

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url);
  const normalized = normalizePathname(pathname);

  if (
    PUBLIC_PATHS.some((p) => normalized.startsWith(p)) ||
    normalized === "/" ||
    normalized.startsWith("/api/auth") ||
    normalized.startsWith("/api/health/db") ||
    normalized.startsWith("/api/invites/verify") ||
    normalized.startsWith("/api/invites/redeem") ||
    normalized.startsWith("/api/push/vapid") ||
    normalized.startsWith("/_next") ||
    normalized.startsWith("/icons")
  ) {
    return NextResponse.next();
  }

  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  const session = token ? await verifySessionToken(token) : null;

  if (normalized.startsWith("/api")) {
    if (pathname === "/api/auth/me") {
      return NextResponse.next();
    }
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    if (normalized.startsWith("/api/admin") && session.role !== "DIRECTOR") {
      return NextResponse.json({ error: "원장만 접근할 수 있습니다." }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (normalized.startsWith("/login")) {
    if (session) {
      const home =
        session.role === "PARENT" && session.childId
          ? PARENT_HOME_PATH
          : getHomeForRole(session.role);
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(getLoginRedirectForPath(normalized, request.url));
  }

  if (!isPathAllowedForRole(normalized, session.role as Role)) {
    return NextResponse.redirect(new URL(getHomeForRole(session.role as Role), request.url));
  }

  if (normalized === "/director") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
