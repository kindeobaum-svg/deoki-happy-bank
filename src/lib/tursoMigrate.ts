import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { getTursoConfig } from "@/lib/tursoConfig";
import { EMBEDDED_TURSO_MIGRATIONS } from "@/lib/tursoEmbeddedMigrations";

type MigrationEntry = { name: string; sql: string };

function listMigrationFolders(): MigrationEntry[] {
  const dir = path.join(process.cwd(), "prisma/migrations");
  if (!fs.existsSync(dir)) return EMBEDDED_TURSO_MIGRATIONS;

  const fromDisk = fs
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

  return fromDisk.length > 0 ? fromDisk : EMBEDDED_TURSO_MIGRATIONS;
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

async function bootstrapExistingDatabase(client: Client, migrationFolders: MigrationEntry[]) {
  const applied = await getAppliedMigrations(client);
  if (applied.size > 0) return;

  const hasUser = await tableExists(client, "User");
  if (!hasUser) return;

  console.log("[tursoMigrate] bootstrapping migration history for existing schema");

  const hasClassRoom = await tableExists(client, "ClassRoom");
  for (const folder of migrationFolders) {
    const isClassRoomMigration = folder.name.includes("class_rooms");
    if (isClassRoomMigration && !hasClassRoom) break;

    await recordMigration(client, folder.name, checksum(folder.sql));
  }
}

async function applyMigration(client: Client, folder: MigrationEntry) {
  const migrationChecksum = checksum(folder.sql);

  console.log(`[tursoMigrate] applying ${folder.name}`);
  try {
    await client.executeMultiple(folder.sql);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/already exists|duplicate column|UNIQUE constraint failed/i.test(message)) {
      console.warn(`[tursoMigrate] ${folder.name} partially applied — continuing`);
    } else {
      throw error;
    }
  }

  await recordMigration(client, folder.name, migrationChecksum);
}

/** Turso DB에 Prisma 마이그레이션 적용 (빌드 시 실패해도 런타임에서 복구) */
export async function applyTursoMigrations(): Promise<void> {
  const turso = getTursoConfig();
  if (!turso) return;

  const client = createClient({ url: turso.url, authToken: turso.authToken });
  const migrationFolders = listMigrationFolders();

  await ensureMigrationsTable(client);
  await bootstrapExistingDatabase(client, migrationFolders);

  const applied = await getAppliedMigrations(client);
  for (const folder of migrationFolders) {
    if (applied.has(folder.name)) continue;
    await applyMigration(client, folder);
  }
}
