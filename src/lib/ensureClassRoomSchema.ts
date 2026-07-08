import { prisma } from "@/lib/db";

const CLASS_ROOM_TABLE = `
CREATE TABLE IF NOT EXISTS "ClassRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const CLASS_ROOM_INDEX = `
CREATE UNIQUE INDEX IF NOT EXISTS "ClassRoom_name_key" ON "ClassRoom"("name")
`;

let ensurePromise: Promise<void> | null = null;

/** ClassRoom 테이블이 없을 때 런타임 생성 (로컬 SQLite·Turso 마이그레이션 누락 대비) */
export async function ensureClassRoomSchema(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await prisma.$executeRawUnsafe(CLASS_ROOM_TABLE);
      await prisma.$executeRawUnsafe(CLASS_ROOM_INDEX);
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}
