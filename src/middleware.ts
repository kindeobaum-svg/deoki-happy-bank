import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/manifest.webmanifest", "/sw.js", "/icons"];

const ROLE_PATHS: Record<string, Role[]> = {
  "/admin": ["DIRECTOR"],
  "/teacher": ["TEACHER", "DIRECTOR"],
  "/parent": ["PARENT", "TEACHER", "DIRECTOR"],
  "/child": ["CHILD", "PARENT", "TEACHER", "DIRECTOR"],
  "/passbook": ["CHILD", "PARENT", "TEACHER", "DIRECTOR"],
};

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/push/vapid") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons")
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

  if (pathname.startsWith("/api")) {
    if (pathname === "/api/auth/me") {
      return NextResponse.next();
    }
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/login")) {
    if (session) {
      return NextResponse.redirect(new URL(getHomeForRole(session.role), request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  for (const [path, roles] of Object.entries(ROLE_PATHS)) {
    if (pathname.startsWith(path) && !roles.includes(session.role)) {
      return NextResponse.redirect(new URL(getHomeForRole(session.role), request.url));
    }
  }

  return NextResponse.next();
}

function getHomeForRole(role: Role) {
  switch (role) {
    case "DIRECTOR":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "PARENT":
      return "/passbook";
    case "CHILD":
      return "/child";
    default:
      return "/";
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
