import type { Role } from "@prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  DIRECTOR: "/admin",
  TEACHER: "/teacher",
  PARENT: "/parent",
  CHILD: "/child",
};

type PathRule = { prefix: string; roles: Role[] };

/** 역할별 전용 경로 — 다른 역할 교차 접근 불가 */
export const PROTECTED_PATH_RULES: PathRule[] = [
  { prefix: "/admin", roles: ["DIRECTOR"] },
  { prefix: "/director", roles: ["DIRECTOR"] },
  { prefix: "/teacher", roles: ["TEACHER"] },
  { prefix: "/parent", roles: ["PARENT"] },
  { prefix: "/passbook", roles: ["PARENT"] },
  { prefix: "/child", roles: ["CHILD"] },
].sort((a, b) => b.prefix.length - a.prefix.length);

/** 교사 전용 API (원장·학부모 차단) — /api/invites 는 별도 처리 */
export const TEACHER_ONLY_API_PREFIXES = [
  "/api/classes",
  "/api/children",
  "/api/praise",
  "/api/attendance",
  "/api/announcements",
  "/api/daily-reports",
] as const;

export function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? pathname;
  const collapsed = withoutQuery.replace(/\/+/g, "/");
  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }
  return collapsed || "/";
}

export function findPathRule(pathname: string): PathRule | null {
  const normalized = normalizePathname(pathname);
  return (
    PROTECTED_PATH_RULES.find(
      (rule) => normalized === rule.prefix || normalized.startsWith(`${rule.prefix}/`),
    ) ?? null
  );
}

export function isPathAllowedForRole(pathname: string, role: Role): boolean {
  const rule = findPathRule(pathname);
  if (!rule) return true;
  return rule.roles.includes(role);
}

export function isTeacherOnlyApi(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return TEACHER_ONLY_API_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function isDirectorOnlyPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    normalized === "/admin" ||
    normalized.startsWith("/admin/") ||
    normalized === "/director" ||
    normalized.startsWith("/director/")
  );
}

export function getLoginRedirectForPath(pathname: string, requestUrl: string): URL {
  const base = new URL(requestUrl);
  const normalized = normalizePathname(pathname);

  if (isDirectorOnlyPath(normalized)) {
    const url = new URL("/login/director", base);
    url.searchParams.set("from", normalized);
    return url;
  }
  if (normalized.startsWith("/teacher")) {
    const url = new URL("/login/teacher", base);
    url.searchParams.set("from", normalized);
    return url;
  }
  if (normalized.startsWith("/parent") || normalized.startsWith("/passbook")) {
    const url = new URL("/login/parent", base);
    url.searchParams.set("from", normalized);
    return url;
  }
  if (normalized.startsWith("/child")) {
    const url = new URL("/login/child", base);
    url.searchParams.set("from", normalized);
    return url;
  }

  const url = new URL("/login", base);
  url.searchParams.set("from", normalized);
  return url;
}

export function getHomeForRole(role: Role): string {
  return ROLE_HOME[role] ?? "/";
}
