import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { getTursoConfig } from "@/lib/tursoConfig";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const VERCEL_BUILD_PLACEHOLDER_DB = "file:/tmp/vercel-build-placeholder.db";

function isVercelBuildPhase(): boolean {
  if (process.env.NEXT_PHASE === "phase-production-build") return true;
  const lifecycle = process.env.npm_lifecycle_event ?? "";
  return lifecycle === "build" || lifecycle === "build:local";
}

function resolveSqliteUrl(): string {
  const configured = process.env.DATABASE_URL;
  if (configured?.startsWith("file:")) return configured;

  return "file:./dev.db";
}

function shouldUseTurso(): boolean {
  return getTursoConfig() !== null;
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

  if (process.env.VERCEL) {
    if (isVercelBuildPhase()) {
      // Vercel build workers may not receive Turso env vars during `next build`.
      // Use a throwaway SQLite URL so route compilation can finish; runtime uses Turso.
      return new PrismaClient({
        datasources: { db: { url: VERCEL_BUILD_PLACEHOLDER_DB } },
        log: ["error"],
      });
    }

    throw new Error(
      "Vercel requires Turso (libsql). Set DATABASE_URL=libsql://...?authToken=... or TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.",
    );
  }

  const sqliteUrl = resolveSqliteUrl();
  return new PrismaClient({
    datasources: { db: { url: sqliteUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export function getDatabaseMode(): "turso" | "sqlite" {
  if (shouldUseTurso()) return "turso";
  return "sqlite";
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
