import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL as PrismaLibSQLNode } from "@prisma/adapter-libsql";
import { PrismaLibSQL as PrismaLibSQLWeb } from "@prisma/adapter-libsql/web";
import { getVercelSqliteUrl } from "@/lib/demoDb";
import { getTursoConfig, toTursoHttpUrl, type TursoConfig } from "@/lib/tursoConfig";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const VERCEL_BUILD_PLACEHOLDER_DB = "file:/tmp/vercel-build-placeholder.db";

/** next build SSG 단계에서만 placeholder — npm run build 중 turso-seed는 제외 */
function isNextBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function resolveSqliteUrl(): string {
  if (process.env.VERCEL) {
    const vercelUrl = getVercelSqliteUrl();
    if (vercelUrl) return vercelUrl;

    const configured = process.env.DATABASE_URL;
    if (configured?.startsWith("file:")) return configured;

    throw new Error(
      "Vercel demo database unavailable. Set Turso env (DATABASE_URL with authToken, or TURSO_*).",
    );
  }

  const configured = process.env.DATABASE_URL;
  if (configured?.startsWith("file:")) return configured;

  return "file:./dev.db";
}

function shouldUseTurso(): boolean {
  return getTursoConfig() !== null;
}

function createTursoAdapter(turso: TursoConfig) {
  const config = {
    url: process.env.VERCEL ? toTursoHttpUrl(turso.url) : turso.url,
    authToken: turso.authToken,
  };
  // Vercel serverless: HTTP-only web adapter (Turso docs)
  if (process.env.VERCEL) {
    return new PrismaLibSQLWeb(config);
  }
  return new PrismaLibSQLNode(config);
}

function createPrismaClient(): PrismaClient {
  const turso = shouldUseTurso() ? getTursoConfig() : null;

  if (turso) {
    return new PrismaClient({
      adapter: createTursoAdapter(turso),
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  if (process.env.VERCEL && isNextBuildPhase()) {
    return new PrismaClient({
      datasources: { db: { url: VERCEL_BUILD_PLACEHOLDER_DB } },
      log: ["error"],
    });
  }

  const sqliteUrl = resolveSqliteUrl();
  return new PrismaClient({
    datasources: { db: { url: sqliteUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export function getDatabaseMode(): "turso" | "vercel-sqlite" | "sqlite" {
  if (shouldUseTurso()) return "turso";
  if (process.env.VERCEL) return "vercel-sqlite";
  return "sqlite";
}

function getPrisma(): PrismaClient {
  if (process.env.VERCEL && isNextBuildPhase()) {
    return createPrismaClient();
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = getPrisma();
}
