import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL as PrismaLibSQLNode } from "@prisma/adapter-libsql";
import { PrismaLibSQL as PrismaLibSQLWeb } from "@prisma/adapter-libsql/web";
import { getTursoConfig, toTursoHttpUrl, type TursoConfig } from "@/lib/tursoConfig";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const VERCEL_BUILD_PLACEHOLDER_DB = "file:/tmp/vercel-build-placeholder.db";

/** next build SSG 단계에서만 placeholder — npm run build 중 turso-seed는 제외 */
function isNextBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL) && !isNextBuildPhase();
}

function resolveLocalSqliteUrl(): string {
  const configured = process.env.DATABASE_URL;
  if (configured?.startsWith("file:")) return configured;
  return "file:./dev.db";
}

function shouldUseTurso(): boolean {
  if (isNextBuildPhase()) return false;
  const configured = process.env.DATABASE_URL ?? "";
  if (configured.startsWith("file:")) return false;
  return getTursoConfig() !== null;
}

function assertTursoOnVercel(): void {
  if (!isVercelRuntime()) return;
  if (getTursoConfig()) return;
  throw new Error(
    "Turso database is required on Vercel. Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (JWT). Demo DB fallback is disabled.",
  );
}

function createTursoAdapter(turso: TursoConfig) {
  const url = process.env.VERCEL ? toTursoHttpUrl(turso.url) : turso.url;
  const config = { url, authToken: turso.authToken };
  if (process.env.VERCEL) {
    return new PrismaLibSQLWeb(config);
  }
  return new PrismaLibSQLNode(config);
}

function createPrismaClient(): PrismaClient {
  if (process.env.VERCEL && isNextBuildPhase()) {
    return new PrismaClient({
      datasources: { db: { url: VERCEL_BUILD_PLACEHOLDER_DB } },
      log: ["error"],
    });
  }

  if (isVercelRuntime()) {
    assertTursoOnVercel();
    const turso = getTursoConfig()!;
    return new PrismaClient({
      adapter: createTursoAdapter(turso),
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  const turso = getTursoConfig();
  if (turso) {
    return new PrismaClient({
      adapter: createTursoAdapter(turso),
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  const sqliteUrl = resolveLocalSqliteUrl();
  return new PrismaClient({
    datasources: { db: { url: sqliteUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export function getDatabaseMode(): "turso" | "sqlite" {
  if (shouldUseTurso()) return "turso";
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
