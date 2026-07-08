import { execSync } from "node:child_process";
import fs from "node:fs";
import { getTursoConfig, isTursoEnvDeclared, tursoProcessEnv } from "./turso-config.mjs";

execSync("npx prisma generate", { stdio: "inherit" });

const turso = getTursoConfig();
const tursoDeclared = isTursoEnvDeclared();
const demoDbPath = "prisma/demo.db";
const demoDbEnv = { ...process.env, DATABASE_URL: "file:./demo.db" };

function bundleDemoDb() {
  console.log("Building bundled SQLite demo database (prisma/demo.db)...");
  if (fs.existsSync(demoDbPath)) {
    fs.unlinkSync(demoDbPath);
  }
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: demoDbEnv });
  execSync("SEED_FORCE=1 npm run db:seed", {
    stdio: "inherit",
    env: { ...demoDbEnv, SEED_FORCE: "1" },
  });
}

if (turso) {
  console.log("Turso production DB detected — migrate + seed");
  const tursoEnv = tursoProcessEnv(turso);
  try {
    execSync("node scripts/turso-migrate.mjs", {
      stdio: "inherit",
      env: tursoEnv,
      timeout: 60_000,
    });
    execSync("node scripts/turso-seed.mjs", {
      stdio: "inherit",
      env: tursoEnv,
      timeout: 60_000,
    });
  } catch (error) {
    console.warn(
      "Turso build-time setup failed (check Vercel env). Deploy continues — runtime uses web adapter.",
      error instanceof Error ? error.message : error,
    );
  }
} else if (tursoDeclared) {
  console.warn(
    "Turso env declared but JWT not resolved — bundling demo.db fallback for Vercel runtime.",
  );
  bundleDemoDb();
} else {
  console.log("No Turso env — building bundled SQLite demo database (prisma/demo.db)...");
  bundleDemoDb();
}

execSync("npx next build", { stdio: "inherit" });
