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

/**
 * Turso 연결 — Prisma/Vercel 공식: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN 우선
 * (DATABASE_URL 내 구 authToken과 불일치 시 HTTP 400 방지)
 */
export function getTursoConfig(): TursoConfig | null {
  const directUrl = (process.env.TURSO_DATABASE_URL ?? "").trim();
  const directToken = process.env.TURSO_AUTH_TOKEN;
  if (directUrl.startsWith("libsql:") && directToken) {
    return { url: stripQuery(directUrl), authToken: normalizeToken(directToken) };
  }

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
