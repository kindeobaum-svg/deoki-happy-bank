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

function getAuthTokenFromDatabaseUrl(): string | null {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl.startsWith("libsql:")) return null;
  try {
    const parsed = new URL(databaseUrl);
    const authToken = parsed.searchParams.get("authToken");
    return authToken ? extractAuthToken(authToken) : null;
  } catch {
    return null;
  }
}

/**
 * Turso 연결 — Prisma/Vercel 공식: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN 우선
 */
export function getTursoConfig(): TursoConfig | null {
  const directUrl = (process.env.TURSO_DATABASE_URL ?? "").trim();
  const directToken = process.env.TURSO_AUTH_TOKEN;
  if (directUrl.startsWith("libsql:") && directToken) {
    let authToken = extractAuthToken(directToken);
    if (!authToken.startsWith("eyJ")) {
      const fromDb = getAuthTokenFromDatabaseUrl();
      if (fromDb) authToken = fromDb;
    }
    return { url: stripQuery(directUrl), authToken };
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (databaseUrl.startsWith("libsql:")) {
    try {
      const parsed = new URL(databaseUrl);
      const authToken = parsed.searchParams.get("authToken");
      if (authToken) {
        parsed.search = "";
        return { url: parsed.toString(), authToken: extractAuthToken(authToken) };
      }
    } catch {
      // fall through
    }
  }

  return null;
}

export function isTursoConfigured(): boolean {
  return getTursoConfig() !== null;
}

export function isValidTursoJwt(token: string): boolean {
  return token.startsWith("eyJ") && token.split(".").length === 3;
}

/** libsql:// → https:// for @libsql/client/web HTTP pipeline */
export function toTursoHttpUrl(url: string): string {
  if (url.startsWith("libsql://")) {
    return `https://${url.slice("libsql://".length)}`;
  }
  return url;
}
