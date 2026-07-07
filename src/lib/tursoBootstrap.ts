import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client/web";
import { getTursoConfig, toTursoHttpUrl } from "@/lib/tursoConfig";

type MigrationEntry = { name: string; sql: string };

function listMigrations(): MigrationEntry[] {
  const dir = path.join(process.cwd(), "prisma/migrations");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((name) => {
      if (name === "migration_lock.toml") return false;
      return fs.statSync(path.join(dir, name)).isDirectory();
    })
    .sort()
    .map((folder) => ({
      name: folder,
      sql: fs.readFileSync(path.join(dir, folder, "migration.sql"), "utf8"),
    }));
}

function checksum(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function tableExists(client: Client, name: string) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [name],
  });
  return result.rows.length > 0;
}

async function ensureMigrationsTable(client: Client) {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);
}

async function getAppliedMigrations(client: Client) {
  const result = await client.execute(
    'SELECT "migration_name" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL',
  );
  return new Set(result.rows.map((row) => String(row.migration_name)));
}

async function recordMigration(client: Client, migrationName: string, migrationChecksum: string) {
  await client.execute({
    sql: `
      INSERT INTO "_prisma_migrations"
        ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
      VALUES (?, ?, datetime('now'), ?, NULL, NULL, datetime('now'), 1)
    `,
    args: [crypto.randomUUID(), migrationChecksum, migrationName],
  });
}

async function applyMigration(client: Client, folder: MigrationEntry) {
  const migrationChecksum = checksum(folder.sql);
  try {
    await client.executeMultiple(folder.sql);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists|duplicate column|UNIQUE constraint failed/i.test(message)) {
      throw error;
    }
  }
  await recordMigration(client, folder.name, migrationChecksum);
}

/** Turso 스키마 마이그레이션 (bootstrapTursoIfNeeded 전용) */
export async function applyTursoMigrations(): Promise<void> {
  const turso = getTursoConfig();
  if (!turso) return;

  const client = createClient({
    url: process.env.VERCEL ? toTursoHttpUrl(turso.url) : turso.url,
    authToken: turso.authToken,
  });
  await client.execute("SELECT 1");

  const migrations = listMigrations();
  await ensureMigrationsTable(client);

  const applied = await getAppliedMigrations(client);
  for (const folder of migrations) {
    if (applied.has(folder.name)) continue;
    await applyMigration(client, folder);
  }

  if (!(await tableExists(client, "ClassRoom"))) {
    const classRoom = migrations.find((m) => m.name.includes("class_rooms"));
    if (classRoom) await client.executeMultiple(classRoom.sql);
  }
}
