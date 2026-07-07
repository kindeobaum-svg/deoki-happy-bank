/** Build/runtime 공통 Turso env 파싱 (tursoConfig.ts와 동일 규칙) */
function normalizeToken(token) {
  return token.trim().replace(/^["']|["']$/g, "");
}

export function getTursoConfig() {
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
  const directToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (directUrl.startsWith("libsql:") && directToken) {
    const url = directUrl.includes("?") ? directUrl.slice(0, directUrl.indexOf("?")) : directUrl;
    return { url, authToken: normalizeToken(directToken) };
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
