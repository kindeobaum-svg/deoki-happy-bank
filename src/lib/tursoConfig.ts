export type TursoConfig = {
  url: string;
  authToken: string;
};

/** TURSO_* vars or DATABASE_URL with ?authToken= (Vercel deploy guide) */
export function getTursoConfig(): TursoConfig | null {
  const directUrl = process.env.TURSO_DATABASE_URL ?? "";
  const directToken = process.env.TURSO_AUTH_TOKEN;
  if (directUrl.startsWith("libsql:") && directToken) {
    return { url: stripQuery(directUrl), authToken: directToken };
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl.startsWith("libsql:")) return null;

  try {
    const parsed = new URL(databaseUrl);
    const authToken = parsed.searchParams.get("authToken");
    if (!authToken) return null;
    parsed.search = "";
    return { url: parsed.toString(), authToken };
  } catch {
    return null;
  }
}

function stripQuery(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}
