export type TursoConfig = {
  url: string;
  authToken: string;
};

function stripQuery(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

function normalizeToken(token: string): string {
  try {
    return decodeURIComponent(token.trim());
  } catch {
    return token.trim();
  }
}

/**
 * Turso 연결 정보 — Prisma adapter-libsql 공식 방식 (libsql:// URL 그대로 사용)
 * DATABASE_URL ?authToken= 우선, 없으면 TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 */
export function getTursoConfig(): TursoConfig | null {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (databaseUrl.startsWith("libsql:")) {
    try {
      const parsed = new URL(databaseUrl);
      const authToken = parsed.searchParams.get("authToken");
      if (authToken) {
        parsed.search = "";
        return { url: parsed.toString(), authToken: normalizeToken(authToken) };
      }
    } catch {
      // fall through
    }
  }

  const directUrl = (process.env.TURSO_DATABASE_URL ?? "").trim();
  const directToken = process.env.TURSO_AUTH_TOKEN;
  if (directUrl.startsWith("libsql:") && directToken) {
    return { url: stripQuery(directUrl), authToken: normalizeToken(directToken) };
  }

  return null;
}

export function isTursoConfigured(): boolean {
  return getTursoConfig() !== null;
}
