import { execSync } from "node:child_process";
import fs from "node:fs";

execSync("prisma generate", { stdio: "inherit" });

const hasTurso =
  process.env.TURSO_DATABASE_URL?.startsWith("libsql:") &&
  Boolean(process.env.TURSO_AUTH_TOKEN);

// Prisma resolves file: paths relative to schema.prisma (prisma/), so use ./demo.db
const demoDbPath = "prisma/demo.db";
const demoDbEnv = { ...process.env, DATABASE_URL: "file:./demo.db" };

if (hasTurso) {
  console.log("Turso detected — running prisma migrate deploy");
  execSync("prisma migrate deploy", { stdio: "inherit" });
} else {
  console.log("Building bundled SQLite demo database (prisma/demo.db)...");
  if (fs.existsSync(demoDbPath)) {
    fs.unlinkSync(demoDbPath);
  }
  execSync("prisma migrate deploy", { stdio: "inherit", env: demoDbEnv });
  execSync("npm run db:seed", { stdio: "inherit", env: demoDbEnv });
}

execSync("next build", { stdio: "inherit" });
