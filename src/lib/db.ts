import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { getVercelSqliteUrl } from "@/lib/demoDb";
import { getTursoConfig } from "@/lib/tursoConfig";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const VERCEL_BUILD_PLACEHOLDER_DB = "file:/tmp/vercel-build-placeholder.db";

function isVercelBuildPhase(): boolean {
  if (process.env.NEXT_PHASE === "phase-production-build") return true;
  const lifecycle = process.env.npm_lifecycle_event ?? "";
  return lifecycle === "build" || lifecycle === "build:local";
}

function resolveSqliteUrl(): string {
  if (process.env.VERCEL) {
    const vercelUrl = getVercelSqliteUrl();
    if (vercelUrl) return vercelUrl;

    const configured = process.env.DATABASE_URL;
    if (configured?.startsWith("file:")) return configured;

    throw new Error(
      "Vercel demo database unavailable. Bundle prisma/demo.db or set Turso env (DATABASE_URL with authToken, or TURSO_*).",
    );
  }

  const configured = process.env.DATABASE_URL;
  if (configured?.startsWith("file:")) return configured;

  return "file:./dev.db";
}

function shouldUseTurso(): boolean {
  const turso = getTursoConfig();
  if (!turso) return false;
  // Explicit Turso URL required on Vercel — otherwise fall back to bundled demo.db
  if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL?.startsWith("libsql:")) {
    return false;
  }
  return true;
}

function createPrismaClient(): PrismaClient {
  const turso = shouldUseTurso() ? getTursoConfig() : null;

  if (turso) {
    const adapter = new PrismaLibSQL({
      url: turso.url,
      authToken: turso.authToken,
    });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  if (process.env.VERCEL && isVercelBuildPhase()) {
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
  if (process.env.VERCEL && isVercelBuildPhase()) {
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
