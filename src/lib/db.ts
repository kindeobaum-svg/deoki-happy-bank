import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { getTursoConfig } from "@/lib/tursoConfig";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function resolveSqliteUrl(): string {
  if (process.env.VERCEL) {
    throw new Error(
      "Vercel requires Turso (libsql). Set DATABASE_URL=libsql://...?authToken=... or TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.",
    );
  }

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
