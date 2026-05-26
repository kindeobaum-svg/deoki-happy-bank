import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function copyBundledSqliteToTmp(): string | null {
  const tmpPath = "/tmp/haengbok-demo.db";
  const bundledPath = path.join(process.cwd(), "prisma", "demo.db");

  try {
    if (!fs.existsSync(bundledPath)) return null;
    if (!fs.existsSync(tmpPath)) {
      fs.copyFileSync(bundledPath, tmpPath);
    }
    return `file:${tmpPath}`;
  } catch (error) {
    console.error("Failed to prepare SQLite database on Vercel:", error);
    return null;
  }
}

function resolveSqliteUrl(): string {
  const vercelTmpUrl = process.env.VERCEL ? copyBundledSqliteToTmp() : null;
  if (vercelTmpUrl) return vercelTmpUrl;

  const configured = process.env.DATABASE_URL;
  if (configured?.startsWith("file:")) return configured;

  return "file:./prisma/dev.db";
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL ?? "";
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl.startsWith("libsql:") && tursoToken) {
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoToken,
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
