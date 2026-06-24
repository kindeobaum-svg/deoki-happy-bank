export const ADMIN_ROUTE_PREFIXES = ["/admin", "/director", "/principal", "/teacher"];

export function normalizePathname(pathname = "/") {
  const normalized = String(pathname || "/").replace(/\/+$/, "");
  return normalized || "/";
}

export function isAdminPath(pathname = "/") {
  const path = normalizePathname(pathname);
  return ADMIN_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
