import { expandConfig } from "@libsql/core/config";

export type TursoConfig = {
  url: string;
  authToken: string;
};

function stripQuery(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

function normalizeToken(token: string): string {
  return token.trim().replace(/^["']|["']$/g, "").replace(/\s/g, "");
}

/** Vercel env에 libsql:// URL이 토큰 칸에 들어간 경우 JWT만 추출 */
function extractAuthToken(raw: string): string {
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
  if (jwt) return jwt[0]!;

  return token;
}

function resolveAuthToken(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const extracted = extractAuthToken(raw);
  return isValidTursoJwt(extracted) ? extracted : null;
}

function libsqlUrlFromExpanded(expanded: ReturnType<typeof expandConfig>): string {
  const host = expanded.authority?.host ?? "";
  const port = expanded.authority?.port;
  const authority = port !== undefined ? `${host}:${port}` : host;
  return `libsql://${authority}${expanded.path ?? ""}`;
}

/** libsql 연결 문자열(URL + ?authToken=) 파싱 — @libsql/core와 동일 규칙 */
function parseLibsqlConnection(connection: string): { url: string; authToken: string | null } | null {
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

function parseLibsqlDatabaseUrl(databaseUrl: string): { url: string; authToken: string | null } | null {
  if (!databaseUrl.startsWith("libsql:")) return null;
  return parseLibsqlConnection(databaseUrl);
}

function normalizeTursoFields(): { rawDbUrl: string; rawAuth: string } {
  let rawDbUrl = (process.env.TURSO_DATABASE_URL ?? "").trim();
  let rawAuth = (process.env.TURSO_AUTH_TOKEN ?? "").trim();

  // Vercel/Turso 연동 시 URL·JWT 필드가 뒤바뀐 경우 자동 교정
  if (rawDbUrl.startsWith("eyJ") && rawAuth.startsWith("libsql:")) {
    [rawDbUrl, rawAuth] = [rawAuth, rawDbUrl];
  }

  return { rawDbUrl, rawAuth };
}

/** TURSO_* 또는 DATABASE_URL(libsql) 중 하나라도 설정됨 */
export function isTursoEnvDeclared(): boolean {
  const { rawDbUrl } = normalizeTursoFields();
  const databaseUrl = process.env.DATABASE_URL ?? "";
  return rawDbUrl.startsWith("libsql:") || databaseUrl.startsWith("libsql:");
}

export function isValidTursoJwt(token: string): boolean {
  return token.startsWith("eyJ") && token.split(".").length === 3;
}

/**
 * Turso 연결 — TURSO_DATABASE_URL + TURSO_AUTH_TOKEN 우선.
 * TURSO_DATABASE_URL에 ?authToken= 이 있거나 TURSO_AUTH_TOKEN에 libsql URL이 있어도 JWT 추출.
 */
export function getTursoConfig(): TursoConfig | null {
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

export function isTursoConfigured(): boolean {
  return getTursoConfig() !== null;
}

/** libsql:// → https:// for @libsql/client/web HTTP pipeline */
export function toTursoHttpUrl(url: string): string {
  if (url.startsWith("libsql://")) {
    return `https://${url.slice("libsql://".length)}`;
  }
  return url;
}
