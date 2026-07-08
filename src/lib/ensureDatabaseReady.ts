import { bootstrapTursoIfNeeded } from "@/lib/bootstrapTurso";
import { resetPrismaClientIfModeChanged } from "@/lib/db";
import { ensureVercelDemoSeed } from "@/lib/ensureVercelDemoSeed";
import { ensureTursoConfigResolved, isTursoEnvDeclared } from "@/lib/tursoConfig";

let readyPromise: Promise<void> | null = null;

/** API 라우트 진입 시 DB 연결·스키마·시드 준비 (Turso 영속성 보장) */
export async function ensureDatabaseReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      if (isTursoEnvDeclared()) {
        await ensureTursoConfigResolved();
      }
      resetPrismaClientIfModeChanged();
      await bootstrapTursoIfNeeded();
      await ensureVercelDemoSeed();
    })().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }

  await readyPromise;
}
