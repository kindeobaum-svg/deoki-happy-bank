import { seedDatabase } from "../../prisma/seed";
import { getDatabaseMode, prisma } from "@/lib/db";

let seedPromise: Promise<void> | null = null;

/** Vercel demo.db 폴백: 사용자가 없으면 시드 (빌드 번들 실패 대비) */
export async function ensureVercelDemoSeed(): Promise<void> {
  if (getDatabaseMode() !== "vercel-sqlite") return;

  if (!seedPromise) {
    seedPromise = (async () => {
      const userCount = await prisma.user.count();
      if (userCount > 0) return;
      console.log("[ensureVercelDemoSeed] empty demo DB — running seed");
      await seedDatabase({ force: true });
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }

  await seedPromise;
}
