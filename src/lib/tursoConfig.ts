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

function parseLibsqlDatabaseUrl(databaseUrl: string): { url: string; authToken: string | null } | null {
  if (!databaseUrl.startsWith("libsql:")) return null;
  try {
    const parsed = new URL(databaseUrl);
    const authToken = resolveAuthToken(parsed.searchParams.get("authToken"));
    parsed.search = "";
    return { url: parsed.toString(), authToken };
  } catch {
    return null;
  }
}

/** TURSO_* 또는 DATABASE_URL(libsql) 중 하나라도 설정됨 */
export function isTursoEnvDeclared(): boolean {
  const directUrl = (process.env.TURSO_DATABASE_URL ?? "").trim();
  const databaseUrl = process.env.DATABASE_URL ?? "";
  return directUrl.startsWith("libsql:") || databaseUrl.startsWith("libsql:");
}

export function isValidTursoJwt(token: string): boolean {
  return token.startsWith("eyJ") && token.split(".").length === 3;
}

/**
 * Turso 연결 — Prisma/Vercel 공식: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN 우선.
 * TURSO_AUTH_TOKEN이 libsql URL만 있으면 DATABASE_URL?authToken= JWT로 폴백.
 */
export function getTursoConfig(): TursoConfig | null {
  const directUrl = stripQuery((process.env.TURSO_DATABASE_URL ?? "").trim());
  const directToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const fromDatabaseUrl = parseLibsqlDatabaseUrl(process.env.DATABASE_URL ?? "");

  let url: string | null = null;
  let authToken: string | null = null;

  if (directUrl.startsWith("libsql:")) {
    url = directUrl;
    authToken = resolveAuthToken(directToken);
    if (!authToken && fromDatabaseUrl?.authToken) {
      authToken = fromDatabaseUrl.authToken;
    }
  }

  if (!url && fromDatabaseUrl) {
    url = fromDatabaseUrl.url;
    authToken = fromDatabaseUrl.authToken;
  } else if (!authToken && fromDatabaseUrl?.authToken) {
    authToken = fromDatabaseUrl.authToken;
  }

  if (url && authToken) {
    return { url, authToken };
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
