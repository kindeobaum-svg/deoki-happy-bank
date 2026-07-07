/** Build/runtime 공통 Turso env 파싱 (tursoConfig.ts와 동일 규칙) */
function normalizeToken(token) {
  return token.trim().replace(/^["']|["']$/g, "").replace(/\s/g, "");
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

function getAuthTokenFromDatabaseUrl() {
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

export function getTursoConfig() {
  const directUrl = (process.env.TURSO_DATABASE_URL ?? "").trim();
  const directToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (directUrl.startsWith("libsql:") && directToken) {
    const url = directUrl.includes("?") ? directUrl.slice(0, directUrl.indexOf("?")) : directUrl;
    let authToken = extractAuthToken(directToken);
    if (!authToken.startsWith("eyJ")) {
      const fromDb = getAuthTokenFromDatabaseUrl();
      if (fromDb) authToken = fromDb;
    }
    return { url, authToken };
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
