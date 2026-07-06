import { execSync } from "node:child_process";
import fs from "node:fs";

/** Vercel 배포 시 Turso 미설정 폴백용 demo.db 번들 (ClassRoom 마이그레이션 포함) */
const demoDbPath = "prisma/demo.db";
const demoDbEnv = { ...process.env, DATABASE_URL: "file:./demo.db" };

console.log("Bundling prisma/demo.db for Vercel fallback...");
if (fs.existsSync(demoDbPath)) {
  fs.unlinkSync(demoDbPath);
}

execSync("prisma migrate deploy", { stdio: "inherit", env: demoDbEnv });
execSync("SEED_FORCE=1 npm run db:seed", {
  stdio: "inherit",
  env: { ...demoDbEnv, SEED_FORCE: "1" },
});
