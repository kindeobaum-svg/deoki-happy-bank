/** Build/runtime 공통 Turso env 파싱 (tursoConfig.ts와 동일 규칙) */
import { expandConfig } from "@libsql/core/config";

function normalizeToken(token) {
  return token.trim().replace(/^["']|["']$/g, "").replace(/\s/g, "");
}

function isValidTursoJwt(token) {
  return token.startsWith("eyJ") && token.split(".").length === 3;
}

function extractAuthToken(raw) {
  let token = normalizeToken(raw);
  if (token.startsWith("Bearer ")) token = token.slice(7).trim();

  if (token.startsWith("libsql:") || token.includes("authToken=")) {
    try {
      const href = token.startsWith("libsql:") ? token.replace(/^libsql:/, "https:") : token;
      const parsed = token.includes("://") ? new URL(href) : new URL(`https://local?${token}`);
      const fromQuery = parsed.searchParams.get("authToken");
      if (fromQuery) return normalizeToken(fromQuery);
    } catch {
      // fall through
    }
  }

  const jwt = token.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
  if (jwt) return jwt[0];

  return token;
}

function resolveAuthToken(raw) {
  if (!raw) return null;
  const extracted = extractAuthToken(raw);
  return isValidTursoJwt(extracted) ? extracted : null;
}

function stripQuery(url) {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

function libsqlUrlFromExpanded(expanded) {
  const host = expanded.authority?.host ?? "";
  const port = expanded.authority?.port;
  const authority = port !== undefined ? `${host}:${port}` : host;
  return `libsql://${authority}${expanded.path ?? ""}`;
}

function parseLibsqlConnection(connection) {
  const trimmed = normalizeToken(connection);
  if (!trimmed.startsWith("libsql:")) return null;

  try {
    const expanded = expandConfig({ url: trimmed }, true);
    const authToken = expanded.authToken ? resolveAuthToken(expanded.authToken) : null;
    return { url: libsqlUrlFromExpanded(expanded), authToken };
  } catch {
    return null;
  }
}

function parseLibsqlDatabaseUrl(databaseUrl) {
  if (!databaseUrl.startsWith("libsql:")) return null;
  return parseLibsqlConnection(databaseUrl);
}

function normalizeTursoFields() {
  let rawDbUrl = (process.env.TURSO_DATABASE_URL ?? "").trim();
  let rawAuth = (process.env.TURSO_AUTH_TOKEN ?? "").trim();

  if (rawDbUrl.startsWith("eyJ") && rawAuth.startsWith("libsql:")) {
    [rawDbUrl, rawAuth] = [rawAuth, rawDbUrl];
  }

  return { rawDbUrl, rawAuth };
}

export function isTursoEnvDeclared() {
  const { rawDbUrl } = normalizeTursoFields();
  const databaseUrl = process.env.DATABASE_URL ?? "";
  return rawDbUrl.startsWith("libsql:") || databaseUrl.startsWith("libsql:");
}

export function getTursoConfig() {
  const { rawDbUrl, rawAuth } = normalizeTursoFields();
  const rawDatabaseUrl = (process.env.DATABASE_URL ?? "").trim();

  const fromTursoDbUrl = rawDbUrl.startsWith("libsql:") ? parseLibsqlConnection(rawDbUrl) : null;
  const fromAuthField = rawAuth.startsWith("libsql:") ? parseLibsqlConnection(rawAuth) : null;
  const fromDatabaseUrl = rawDatabaseUrl.startsWith("libsql:")
    ? parseLibsqlDatabaseUrl(rawDatabaseUrl)
    : null;

  const url =
    fromTursoDbUrl?.url ??
    (rawDbUrl.startsWith("libsql:") ? stripQuery(rawDbUrl) : null) ??
    fromAuthField?.url ??
    fromDatabaseUrl?.url ??
    null;

  const authToken =
    resolveAuthToken(rawAuth) ??
    fromTursoDbUrl?.authToken ??
    fromAuthField?.authToken ??
    fromDatabaseUrl?.authToken ??
    null;

  if (url && authToken) {
    return { url: stripQuery(url), authToken };
  }

  return null;
}

/** libsql:// → https:// for @libsql/client/web */
export function toTursoHttpUrl(url) {
  if (url.startsWith("libsql://")) {
    return `https://${url.slice("libsql://".length)}`;
  }
  return url;
}

export function tursoProcessEnv(turso) {
  return {
    ...process.env,
    DATABASE_URL: `${turso.url}?authToken=${encodeURIComponent(turso.authToken)}`,
    TURSO_DATABASE_URL: turso.url,
    TURSO_AUTH_TOKEN: turso.authToken,
  };
}
