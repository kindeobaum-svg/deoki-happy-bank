import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { getVercelSqliteUrl, warmDemoDatabase } from "@/lib/demoDb";
import { getTursoConfig } from "@/lib/tursoConfig";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function resolveSqliteUrl(): string {
  if (process.env.VERCEL) {
    warmDemoDatabase();
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

function createPrismaClient(): PrismaClient {
  const turso = getTursoConfig();

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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
