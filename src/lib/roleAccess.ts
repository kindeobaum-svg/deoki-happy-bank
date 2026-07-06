import type { Role } from "@prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  DIRECTOR: "/admin",
  TEACHER: "/teacher",
  PARENT: "/parent",
  CHILD: "/child",
};

type PathRule = { prefix: string; roles: Role[] };

/** 긴 prefix 우선 — 더 구체적인 규칙이 먼저 적용 */
export const PROTECTED_PATH_RULES: PathRule[] = [
  { prefix: "/admin", roles: ["DIRECTOR"] as Role[] },
  { prefix: "/director", roles: ["DIRECTOR"] as Role[] },
  { prefix: "/teacher", roles: ["TEACHER", "DIRECTOR"] as Role[] },
  { prefix: "/parent", roles: ["PARENT", "TEACHER", "DIRECTOR"] as Role[] },
  { prefix: "/child", roles: ["CHILD", "PARENT", "TEACHER", "DIRECTOR"] as Role[] },
  { prefix: "/passbook", roles: ["CHILD", "PARENT", "TEACHER", "DIRECTOR"] as Role[] },
].sort((a, b) => b.prefix.length - a.prefix.length);

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
  if (normalized.startsWith("/parent")) {
    const url = new URL("/login/parent", base);
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
