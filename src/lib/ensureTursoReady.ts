import { getDatabaseMode, prisma } from "@/lib/db";
import { applyTursoMigrations } from "@/lib/tursoMigrate";
import { seedDatabase } from "../../prisma/seed";

let readyPromise: Promise<void> | null = null;

/** Turso: 마이그레이션 + 빈 DB 시 시드 (첫 API 요청 시 1회) */
export async function ensureTursoReady(): Promise<void> {
  if (getDatabaseMode() !== "turso") return;

  if (!readyPromise) {
    readyPromise = (async () => {
      await applyTursoMigrations();
      const userCount = await prisma.user.count();
      if (userCount > 0) return;
      console.log("[ensureTursoReady] empty Turso DB — running seed");
      await seedDatabase({ force: true });
    })().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }

  await readyPromise;
}
