import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import {
  getHomeForRole,
  getLoginRedirectForPath,
  isPathAllowedForRole,
  isTeacherOnlyApi,
  normalizePathname,
} from "@/lib/roleAccess";

const PUBLIC_PATHS = ["/login", "/manifest.webmanifest", "/sw.js", "/icons"];

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url);
  const normalized = normalizePathname(pathname);

  if (
    PUBLIC_PATHS.some((p) => normalized.startsWith(p)) ||
    normalized.startsWith("/api/auth") ||
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

  if (normalized === "/" && !session) {
    return NextResponse.next();
  }

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
    if (isTeacherOnlyApi(normalized) && session.role !== "TEACHER") {
      return NextResponse.json({ error: "교사만 접근할 수 있습니다." }, { status: 403 });
    }
    if (
      (normalized === "/api/invites" || normalized.startsWith("/api/invites/")) &&
      session.role !== "TEACHER" &&
      session.role !== "DIRECTOR"
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (normalized.startsWith("/login")) {
    if (session) {
      return NextResponse.redirect(new URL(getHomeForRole(session.role as Role), request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(getLoginRedirectForPath(normalized, request.url));
  }

  if (normalized === "/" || !isPathAllowedForRole(normalized, session.role as Role)) {
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
