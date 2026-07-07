/**
 * Turso DB 시드 — 빌드 시 1회 (User 테이블이 비어 있을 때만)
 */
import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";
import { getTursoConfig, tursoProcessEnv } from "./turso-config.mjs";

const turso = getTursoConfig();
if (!turso) {
  console.log("Turso not configured — skipping seed.");
  process.exit(0);
}

const client = createClient({ url: turso.url, authToken: turso.authToken });

try {
  await client.execute("SELECT 1");
} catch (error) {
  console.error("Turso connection failed before seed:", error);
  process.exit(1);
}

let userCount = 0;
try {
  const result = await client.execute("SELECT COUNT(*) AS c FROM User");
  userCount = Number(result.rows[0]?.c ?? 0);
} catch {
  // User 테이블 없음 — migrate가 먼저 실행되어야 함
  console.error("User table missing — run turso-migrate.mjs first.");
  process.exit(1);
}

if (userCount > 0) {
  console.log(`Turso seed skipped — ${userCount} user(s) already exist.`);
  process.exit(0);
}

console.log("Seeding Turso database...");
execSync("npx tsx prisma/seed.ts", {
  stdio: "inherit",
  env: tursoProcessEnv(turso),
});
console.log("Turso seed complete.");
