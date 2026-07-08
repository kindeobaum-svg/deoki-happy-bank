/**
 * DB 준비 — 마이그레이션 적용 후, 사용자가 없을 때만 시드 (기존 데이터 절대 삭제하지 않음)
 */
import { getDatabaseMode, prisma } from "@/lib/db";
import { ensureClassRoomSchema } from "@/lib/ensureClassRoomSchema";
import { applyTursoMigrations } from "@/lib/tursoBootstrap";
import { ensureTursoConfigResolved } from "@/lib/tursoConfig";
import { seedDatabase } from "../../prisma/seed";

let readyPromise: Promise<void> | null = null;

async function seedIfEmpty(): Promise<void> {
  let userCount = 0;
  try {
    userCount = await prisma.user.count();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/does not exist/i.test(message)) throw error;
  }
  if (userCount > 0) return;
  console.log("[ensureDatabaseReady] empty database — seeding demo accounts");
  await seedDatabase();
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      const mode = getDatabaseMode();

      if (mode === "turso") {
        await ensureTursoConfigResolved();
        await applyTursoMigrations();
      } else {
        await ensureClassRoomSchema();
      }

      await seedIfEmpty();
    })().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }

  await readyPromise;
}

/** @deprecated use ensureDatabaseReady */
export const bootstrapTursoIfNeeded = ensureDatabaseReady;
