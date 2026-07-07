import { ensureTursoReady } from "@/lib/ensureTursoReady";
import { ensureVercelDemoSeed } from "@/lib/ensureVercelDemoSeed";

/** Vercel demo SQLite 시드 + Turso 마이그레이션/시드 (API 핸들러 진입 시) */
export async function ensureDbReady(): Promise<void> {
  await ensureVercelDemoSeed();
  await ensureTursoReady();
}
