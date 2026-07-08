import { execSync } from "node:child_process";
import { getTursoConfig, isTursoEnvDeclared } from "./turso-config.mjs";

execSync("npx prisma generate", { stdio: "inherit" });

const turso = getTursoConfig();
const tursoDeclared = isTursoEnvDeclared();

if (!turso) {
  if (tursoDeclared) {
    console.error(
      "Turso env is declared but JWT could not be resolved. Fix TURSO_DATABASE_URL / TURSO_AUTH_TOKEN and redeploy.",
    );
  } else {
    console.error(
      "Turso is required for production deploy. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel environment variables.",
    );
  }
  process.exit(1);
}

console.log("Turso production DB detected — migrate + seed");
const { tursoProcessEnv } = await import("./turso-config.mjs");
const tursoEnv = tursoProcessEnv(turso);

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

execSync("npx next build", { stdio: "inherit" });
