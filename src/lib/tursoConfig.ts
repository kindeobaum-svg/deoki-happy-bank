export type TursoConfig = {
  url: string;
  authToken: string;
};

/** DATABASE_URL ?authToken= 우선 — TURSO_AUTH_TOKEN 불일치 시 HTTP 400 방지 */
export function getTursoConfig(): TursoConfig | null {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (databaseUrl.startsWith("libsql:")) {
    try {
      const parsed = new URL(databaseUrl);
      const authToken = parsed.searchParams.get("authToken");
      if (authToken) {
        parsed.search = "";
        return { url: parsed.toString(), authToken };
      }
    } catch {
      // fall through
    }
  }

  const directUrl = process.env.TURSO_DATABASE_URL ?? "";
  const directToken = process.env.TURSO_AUTH_TOKEN;
  if (directUrl.startsWith("libsql:") && directToken) {
    return { url: stripQuery(directUrl), authToken: directToken };
  }

  return null;
}

function stripQuery(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}
