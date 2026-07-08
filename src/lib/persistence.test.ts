import { afterEach, describe, expect, it, vi } from "vitest";
import { createClassRoom, listClassRooms } from "@/lib/classService";
import { ensureClassRoomForChild } from "@/lib/classService";

const TEST_CLASS = `persist-test-${Date.now()}`;
const TEST_CHILD = `persist-child-${Date.now()}`;

describe("class and child DB persistence", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("persists class and child across fresh prisma reads (logout/login simulation)", async () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("DATABASE_URL", "file:./dev.db");
    vi.stubEnv("TURSO_DATABASE_URL", "");
    vi.stubEnv("TURSO_AUTH_TOKEN", "");

    const { prisma } = await import("@/lib/db");
    const { ensureDatabaseReady } = await import("@/lib/bootstrapTurso");

    await ensureDatabaseReady();

    const classRoom = await createClassRoom(prisma, TEST_CLASS);
    expect(classRoom.name).toBe(TEST_CLASS);

    await ensureClassRoomForChild(prisma, TEST_CLASS);
    const child = await prisma.child.create({
      data: {
        name: TEST_CHILD,
        className: TEST_CLASS,
        accountNumber: `TEST-${Date.now()}`,
        avatar: "🌻",
        points: 0,
        totalSaved: 0,
      },
    });

    const classesAfterWrite = await listClassRooms(prisma);
    expect(classesAfterWrite.some((c) => c.name === TEST_CLASS)).toBe(true);

    const childrenAfterWrite = await prisma.child.findMany({ where: { className: TEST_CLASS } });
    expect(childrenAfterWrite.some((c) => c.id === child.id)).toBe(true);

    vi.resetModules();
    const { prisma: freshPrisma } = await import("@/lib/db");

    const classesAfterReload = await listClassRooms(freshPrisma);
    expect(classesAfterReload.some((c) => c.name === TEST_CLASS)).toBe(true);

    const childrenAfterReload = await freshPrisma.child.findMany({ where: { className: TEST_CLASS } });
    expect(childrenAfterReload.some((c) => c.id === child.id)).toBe(true);

    await freshPrisma.child.delete({ where: { id: child.id } });
    await freshPrisma.classRoom.delete({ where: { id: classRoom.id } });
  });
});
