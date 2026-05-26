import { execSync } from "node:child_process";

execSync("prisma generate", { stdio: "inherit" });

const hasTurso =
  process.env.TURSO_DATABASE_URL?.startsWith("libsql:") &&
  Boolean(process.env.TURSO_AUTH_TOKEN);

if (hasTurso) {
  console.log("Turso detected — running prisma migrate deploy");
  execSync("prisma migrate deploy", { stdio: "inherit" });
} else {
  console.log("Using bundled SQLite (demo mode) — skipping migrate deploy");
}

execSync("next build", { stdio: "inherit" });
