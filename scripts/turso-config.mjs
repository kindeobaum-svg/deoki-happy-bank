/** Build/runtime 공통 Turso env 파싱 (tursoConfig.ts와 동일 규칙) */
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

function parseLibsqlDatabaseUrl(databaseUrl) {
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

export function getTursoConfig() {
  const directUrl = stripQuery((process.env.TURSO_DATABASE_URL ?? "").trim());
  const directToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const fromDatabaseUrl = parseLibsqlDatabaseUrl(process.env.DATABASE_URL ?? "");

  let url = null;
  let authToken = null;

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
