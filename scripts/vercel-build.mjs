import { execSync } from "node:child_process";
import fs from "node:fs";

function getTursoConfig() {
  const directUrl = process.env.TURSO_DATABASE_URL ?? "";
  const directToken = process.env.TURSO_AUTH_TOKEN;
  if (directUrl.startsWith("libsql:") && directToken) {
    const url = directUrl.includes("?") ? directUrl.slice(0, directUrl.indexOf("?")) : directUrl;
    return { url, authToken: directToken };
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl.startsWith("libsql:")) return null;

  try {
    const parsed = new URL(databaseUrl);
    const authToken = parsed.searchParams.get("authToken");
    if (!authToken) return null;
    parsed.search = "";
    return { url: parsed.toString(), authToken };
  } catch {
    return null;
  }
}

execSync("prisma generate", { stdio: "inherit" });

const turso = getTursoConfig();
const demoDbPath = "prisma/demo.db";
const demoDbEnv = { ...process.env, DATABASE_URL: "file:./demo.db" };

if (turso) {
  // Prisma CLI cannot use libsql:// URLs. ClassRoom schema is ensured at runtime
  // (see src/lib/ensureClassRoomSchema.ts). Optional build-time sync when Turso is reachable:
  console.log("Turso detected — skipping Prisma CLI migrate; runtime schema ensure enabled.");
  try {
    execSync("node scripts/turso-migrate.mjs", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: `${turso.url}?authToken=${turso.authToken}`,
        TURSO_DATABASE_URL: turso.url,
        TURSO_AUTH_TOKEN: turso.authToken,
      },
      timeout: 15_000,
    });
  } catch (error) {
    console.warn("Optional Turso build-time migration skipped:", error instanceof Error ? error.message : error);
  }
} else {
  console.log("Building bundled SQLite demo database (prisma/demo.db)...");
  if (fs.existsSync(demoDbPath)) {
    fs.unlinkSync(demoDbPath);
  }
  execSync("prisma migrate deploy", { stdio: "inherit", env: demoDbEnv });
  execSync("SEED_FORCE=1 npm run db:seed", { stdio: "inherit", env: { ...demoDbEnv, SEED_FORCE: "1" } });
}

execSync("next build", { stdio: "inherit" });
