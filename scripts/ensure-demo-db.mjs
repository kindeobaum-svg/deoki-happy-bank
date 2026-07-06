import { execSync } from "node:child_process";
import fs from "node:fs";

/** Vercel 배포 시 Turso 미설정 폴백용 demo.db 번들 */
const demoDbPath = "prisma/demo.db";
const demoDbEnv = { ...process.env, DATABASE_URL: "file:./demo.db" };

if (fs.existsSync(demoDbPath)) {
  console.log("demo.db already present — skip bundle");
  process.exit(0);
}

console.log("Bundling prisma/demo.db for Vercel fallback...");
execSync("prisma migrate deploy", { stdio: "inherit", env: demoDbEnv });
execSync("SEED_FORCE=1 npm run db:seed", {
  stdio: "inherit",
  env: { ...demoDbEnv, SEED_FORCE: "1" },
});
