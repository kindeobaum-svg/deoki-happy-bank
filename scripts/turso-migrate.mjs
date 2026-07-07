/**
 * Apply Prisma migration SQL to Turso via @libsql/client.
 * Prisma CLI (migrate deploy / db push) only accepts file: URLs for sqlite.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { getTursoConfig } from "./turso-config.mjs";

function listMigrationFolders() {
  const dir = path.join(process.cwd(), "prisma/migrations");
  return fs
    .readdirSync(dir)
    .filter((name) => {
      if (name === "migration_lock.toml") return false;
      return fs.statSync(path.join(dir, name)).isDirectory();
    })
    .sort();
}

function checksum(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function tableExists(client, name) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [name],
  });
  return result.rows.length > 0;
}

async function ensureMigrationsTable(client) {
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

async function getAppliedMigrations(client) {
  const result = await client.execute(
    'SELECT "migration_name" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL',
  );
  return new Set(result.rows.map((row) => String(row.migration_name)));
}

async function recordMigration(client, migrationName, migrationChecksum) {
  await client.execute({
    sql: `
      INSERT INTO "_prisma_migrations"
        ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
      VALUES (?, ?, datetime('now'), ?, NULL, NULL, datetime('now'), 1)
    `,
    args: [crypto.randomUUID(), migrationChecksum, migrationName],
  });
}

async function bootstrapExistingDatabase(client, migrationFolders) {
  const applied = await getAppliedMigrations(client);
  if (applied.size > 0) return;

  const hasUser = await tableExists(client, "User");
  if (!hasUser) return;

  console.log("Existing Turso schema detected without migration history — bootstrapping records.");

  const hasClassRoom = await tableExists(client, "ClassRoom");
  for (const folder of migrationFolders) {
    const isClassRoomMigration = folder.includes("class_rooms");
    if (isClassRoomMigration && !hasClassRoom) break;

    const sqlPath = path.join(process.cwd(), "prisma/migrations", folder, "migration.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await recordMigration(client, folder, checksum(sql));
    console.log(`  marked applied (bootstrap): ${folder}`);
  }
}

async function applyMigration(client, folder) {
  const sqlPath = path.join(process.cwd(), "prisma/migrations", folder, "migration.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const migrationChecksum = checksum(sql);

  console.log(`Applying migration: ${folder}`);
  try {
    await client.executeMultiple(sql);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/already exists|duplicate column|UNIQUE constraint failed/i.test(message)) {
      console.warn(`  migration ${folder} partially applied — continuing (${message})`);
    } else {
      throw error;
    }
  }

  await recordMigration(client, folder, migrationChecksum);
}

async function ensureClassRoomTable(client) {
  if (await tableExists(client, "ClassRoom")) {
    console.log("ClassRoom table already exists.");
    return;
  }

  const sqlPath = path.join(
    process.cwd(),
    "prisma/migrations/20260706180000_class_rooms/migration.sql",
  );
  console.log("Ensuring ClassRoom table exists...");
  await client.executeMultiple(fs.readFileSync(sqlPath, "utf8"));
}

async function main() {
  const turso = getTursoConfig();
  if (!turso) {
    console.error("Turso env vars not configured (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN).");
    process.exit(1);
  }

  const client = createClient({ url: turso.url, authToken: turso.authToken });
  const migrationFolders = listMigrationFolders();

  await ensureMigrationsTable(client);
  await bootstrapExistingDatabase(client, migrationFolders);

  const applied = await getAppliedMigrations(client);
  let appliedCount = 0;

  for (const folder of migrationFolders) {
    if (applied.has(folder)) continue;
    await applyMigration(client, folder);
    appliedCount += 1;
  }

  await ensureClassRoomTable(client);

  console.log(
    appliedCount === 0
      ? "Turso migrations up to date."
      : `Applied ${appliedCount} migration(s) to Turso.`,
  );
}

main().catch((error) => {
  console.error("Turso migration failed:", error);
  process.exit(1);
});
