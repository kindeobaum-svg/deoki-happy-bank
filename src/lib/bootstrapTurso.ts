/**
 * Turso 최초 부트스트랩 — 빌드 시 migrate/seed 실패 시 로그인 1회에만 실행
 * (API 라우트마다 ensureTursoReady 호출하지 않음)
 */
import { getDatabaseMode, prisma } from "@/lib/db";
import { applyTursoMigrations } from "@/lib/tursoBootstrap";
import { ensureTursoConfigResolved } from "@/lib/tursoConfig";
import { seedDatabase } from "../../prisma/seed";

let bootstrapPromise: Promise<void> | null = null;

export async function bootstrapTursoIfNeeded(): Promise<void> {
  if (getDatabaseMode() !== "turso") return;

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await ensureTursoConfigResolved();
      try {
        await prisma.user.count();
      } catch {
        console.log("[bootstrapTurso] applying migrations + seed");
        await applyTursoMigrations();
        await seedDatabase({ force: true });
      }
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  await bootstrapPromise;
}
