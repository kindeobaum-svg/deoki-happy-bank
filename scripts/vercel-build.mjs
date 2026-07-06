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

function run(command, env = process.env) {
  execSync(command, { stdio: "inherit", env });
}

execSync("prisma generate", { stdio: "inherit" });

const turso = getTursoConfig();
const demoDbPath = "prisma/demo.db";
const demoDbEnv = { ...process.env, DATABASE_URL: "file:./demo.db" };

if (turso) {
  const tursoEnv = {
    ...process.env,
    DATABASE_URL: `${turso.url}?authToken=${turso.authToken}`,
    TURSO_DATABASE_URL: turso.url,
    TURSO_AUTH_TOKEN: turso.authToken,
  };

  // Prisma CLI only accepts file: URLs for sqlite — try libsql migration, but do not block deploy.
  console.log("Turso detected — syncing schema via libsql to", turso.url);
  try {
    run("node scripts/turso-migrate.mjs", tursoEnv);
  } catch (error) {
    console.warn("Turso build-time migration skipped (runtime ensure will apply ClassRoom):", error);
  }
} else {
  console.log("Building bundled SQLite demo database (prisma/demo.db)...");
  if (fs.existsSync(demoDbPath)) {
    fs.unlinkSync(demoDbPath);
  }
  run("prisma migrate deploy", demoDbEnv);
  run("SEED_FORCE=1 npm run db:seed", { ...demoDbEnv, SEED_FORCE: "1" });
}

run("next build");
