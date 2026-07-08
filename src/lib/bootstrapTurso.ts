/**
 * Turso 최초 부트스트랩 — 빈 DB에만 마이그레이션·시드 (기존 데이터 절대 삭제하지 않음)
 */
import { getDatabaseMode, prisma } from "@/lib/db";
import { applyTursoMigrations } from "@/lib/tursoBootstrap";
import { ensureTursoConfigResolved } from "@/lib/tursoConfig";
import { seedDatabase } from "../../prisma/seed";

let bootstrapPromise: Promise<void> | null = null;

function isSchemaMissingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /does not exist|no such table|SQLITE_ERROR/i.test(message);
}

export async function bootstrapTursoIfNeeded(): Promise<void> {
  if (getDatabaseMode() !== "turso") return;

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await ensureTursoConfigResolved();

      try {
        await prisma.user.count();
      } catch (error) {
        if (!isSchemaMissingError(error)) {
          throw error;
        }
        console.log("[bootstrapTurso] schema missing — applying migrations");
        await applyTursoMigrations();
      }

      const userCount = await prisma.user.count().catch(() => -1);
      if (userCount === 0) {
        console.log("[bootstrapTurso] empty database — initial seed (no wipe)");
        await seedDatabase({ force: false });
      }
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  await bootstrapPromise;
}
