import { expandConfig } from "@libsql/core/config";

export type TursoConfig = {
  url: string;
  authToken: string;
};

let runtimeCache: TursoConfig | null = null;
let runtimeResolveAttempted = false;

function stripQuery(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

function normalizeToken(token: string): string {
  let value = token.trim().replace(/^["']|["']$/g, "").replace(/\s/g, "");
  try {
    if (value.includes("%")) value = decodeURIComponent(value);
  } catch {
    // keep original
  }
  return value;
}

/** Vercel env에 libsql:// URL이 토큰 칸에 들어간 경우 JWT만 추출 */
function extractAuthToken(raw: string): string {
  let token = normalizeToken(raw);
  if (token.startsWith("Bearer ")) token = token.slice(7).trim();

  if (token.startsWith("libsql:") || token.includes("authToken=") || token.includes("token=")) {
    try {
      const href = token.startsWith("libsql:") ? token.replace(/^libsql:/, "https:") : token;
      const parsed = token.includes("://") ? new URL(href) : new URL(`https://local?${token}`);
      for (const key of ["authToken", "token", "jwt"]) {
        const fromQuery = parsed.searchParams.get(key);
        if (fromQuery) return normalizeToken(fromQuery);
      }
    } catch {
      // fall through
    }
  }

  const jwt = token.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
  if (jwt) return jwt[0]!;

  return token;
}

export function isValidTursoJwt(token: string): boolean {
  return token.startsWith("eyJ") && token.split(".").length === 3;
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

  if (rawDbUrl.startsWith("eyJ") && rawAuth.startsWith("libsql:")) {
    [rawDbUrl, rawAuth] = [rawAuth, rawDbUrl];
  }

  return { rawDbUrl, rawAuth };
}

function libsqlUrlFromHost(host: string): string {
  return `libsql://${host}`;
}

function parseTursoHostname(host: string): { databaseName: string; organizationSlug: string } | null {
  const base = host.replace(/\.aws-[^.]+\.turso\.io$/i, ".turso.io");
  if (!base.endsWith(".turso.io")) return null;
  const stem = base.slice(0, -".turso.io".length);

  const orgEnv = process.env.TURSO_ORG?.trim() || process.env.TURSO_ORGANIZATION?.trim();
  if (orgEnv && stem.endsWith(`-${orgEnv}`)) {
    return {
      databaseName: stem.slice(0, -(orgEnv.length + 1)),
      organizationSlug: orgEnv,
    };
  }

  const parts = stem.split("-");
  if (parts.length >= 3) {
    return {
      databaseName: parts.slice(0, -2).join("-"),
      organizationSlug: parts.slice(-2).join("-"),
    };
  }
  if (parts.length === 2) {
    return { databaseName: parts[0]!, organizationSlug: parts[1]! };
  }
  return null;
}

/** Vercel/Turso 연동이 비표준 env 이름으로 JWT를 넣는 경우 turso/libsql 관련 키만 스캔 */
function scanEnvForTursoConfig(): TursoConfig | null {
  let foundUrl: string | null = null;
  let foundToken: string | null = null;

  for (const [key, value] of Object.entries(process.env)) {
    if (!value?.trim()) continue;
    if (!/turso|libsql|database/i.test(key)) continue;

    const trimmed = value.trim();
    const jwt = resolveAuthToken(trimmed);
    if (jwt) foundToken ??= jwt;

    if (trimmed.startsWith("libsql:")) {
      const parsed = parseLibsqlConnection(trimmed);
      if (parsed?.url) foundUrl ??= parsed.url;
      if (parsed?.authToken) foundToken ??= parsed.authToken;
    }
  }

  if (foundUrl && foundToken) {
    return { url: stripQuery(foundUrl), authToken: foundToken };
  }
  return null;
}

function parseJsonConnection(raw: string): TursoConfig | null {
  const trimmed = normalizeToken(raw);
  if (!trimmed.startsWith("{")) return null;
  try {
    const obj = JSON.parse(trimmed) as Record<string, unknown>;
    const urlCandidate = [obj.url, obj.databaseUrl, obj.TURSO_DATABASE_URL, obj.database_url].find(
      (v) => typeof v === "string" && (v as string).startsWith("libsql:"),
    ) as string | undefined;
    const tokenCandidate = [obj.authToken, obj.token, obj.TURSO_AUTH_TOKEN, obj.auth_token].find(
      (v) => typeof v === "string",
    ) as string | undefined;
    const authToken = tokenCandidate ? resolveAuthToken(tokenCandidate) : null;
    if (urlCandidate && authToken) {
      return { url: stripQuery(urlCandidate), authToken };
    }
  } catch {
    // not JSON
  }
  return null;
}

function resolveTursoConfigFromEnv(): TursoConfig | null {
  const { rawDbUrl, rawAuth } = normalizeTursoFields();
  const rawDatabaseUrl = (process.env.DATABASE_URL ?? "").trim();

  for (const raw of [rawDbUrl, rawAuth, rawDatabaseUrl]) {
    const fromJson = parseJsonConnection(raw);
    if (fromJson) return fromJson;
  }

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

  return scanEnvForTursoConfig();
}

async function mintTursoTokenViaPlatform(): Promise<TursoConfig | null> {
  const apiToken =
    process.env.TURSO_API_TOKEN?.trim() ||
    process.env.TURSO_PLATFORM_API_TOKEN?.trim() ||
    process.env.TURSO_PLATFORM_TOKEN?.trim();
  if (!apiToken) return null;

  const { rawDbUrl } = normalizeTursoFields();
  if (!rawDbUrl.startsWith("libsql:")) return null;

  let host: string;
  try {
    host = new URL(rawDbUrl.replace(/^libsql:/, "https:").split("?")[0]!).hostname;
  } catch {
    return null;
  }

  const parsed = parseTursoHostname(host);
  const org =
    process.env.TURSO_ORG?.trim() ||
    process.env.TURSO_ORGANIZATION?.trim() ||
    parsed?.organizationSlug;
  const db =
    process.env.TURSO_DATABASE?.trim() ||
    process.env.TURSO_DB_NAME?.trim() ||
    parsed?.databaseName;
  if (!org || !db) return null;

  const res = await fetch(
    `https://api.turso.tech/v1/organizations/${encodeURIComponent(org)}/databases/${encodeURIComponent(db)}/auth/tokens?expiration=1h&authorization=full-access`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}` },
    },
  );
  if (!res.ok) return null;

  const body = (await res.json()) as { jwt?: string };
  if (!body.jwt || !isValidTursoJwt(body.jwt)) return null;

  return { url: libsqlUrlFromHost(host), authToken: body.jwt };
}

export function setResolvedTursoConfig(config: TursoConfig | null): void {
  runtimeCache = config;
}

/** 서버 cold start 시 Turso JWT 해석 (instrumentation / health) */
export async function ensureTursoConfigResolved(): Promise<TursoConfig | null> {
  const fromEnv = resolveTursoConfigFromEnv();
  if (fromEnv) {
    runtimeCache = fromEnv;
    return fromEnv;
  }
  if (runtimeResolveAttempted) return runtimeCache;
  runtimeResolveAttempted = true;

  const minted = await mintTursoTokenViaPlatform();
  runtimeCache = minted;
  return minted;
}

/** TURSO_* 또는 DATABASE_URL(libsql) 중 하나라도 설정됨 */
export function isTursoEnvDeclared(): boolean {
  const { rawDbUrl } = normalizeTursoFields();
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (rawDbUrl.startsWith("libsql:") || databaseUrl.startsWith("libsql:")) return true;

  for (const value of Object.values(process.env)) {
    if (value?.trim().startsWith("libsql:")) return true;
  }
  return false;
}

/**
 * Turso 연결 — TURSO_DATABASE_URL + TURSO_AUTH_TOKEN 우선.
 * JWT는 연결 문자열, 다른 env 이름, Platform API mint 순으로 탐색.
 */
export function getTursoConfig(): TursoConfig | null {
  return runtimeCache ?? resolveTursoConfigFromEnv();
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
