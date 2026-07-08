import { describe, expect, it, vi, afterEach } from "vitest";

describe("bootstrapTursoIfNeeded", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("does not call seedDatabase with force:true on schema errors", async () => {
    const seedDatabase = vi.fn().mockResolvedValue(undefined);
    const applyTursoMigrations = vi.fn().mockResolvedValue(undefined);

    vi.doMock("../../prisma/seed", () => ({ seedDatabase }));
    vi.doMock("@/lib/tursoBootstrap", () => ({ applyTursoMigrations }));
    vi.doMock("@/lib/tursoConfig", () => ({
      ensureTursoConfigResolved: vi.fn().mockResolvedValue({ url: "libsql://x.turso.io", authToken: "eyJ.a.b" }),
    }));

    let callCount = 0;
    vi.doMock("@/lib/db", () => ({
      getDatabaseMode: () => "turso",
      prisma: {
        user: {
          count: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              throw new Error("no such table: User");
            }
            return Promise.resolve(0);
          }),
        },
      },
    }));

    const { bootstrapTursoIfNeeded } = await import("@/lib/bootstrapTurso");
    await bootstrapTursoIfNeeded();

    expect(applyTursoMigrations).toHaveBeenCalled();
    expect(seedDatabase).toHaveBeenCalledWith({ force: false });
    expect(seedDatabase).not.toHaveBeenCalledWith({ force: true });
  });

  it("skips seed when users already exist", async () => {
    const seedDatabase = vi.fn().mockResolvedValue(undefined);

    vi.doMock("../../prisma/seed", () => ({ seedDatabase }));
    vi.doMock("@/lib/tursoBootstrap", () => ({ applyTursoMigrations: vi.fn() }));
    vi.doMock("@/lib/tursoConfig", () => ({
      ensureTursoConfigResolved: vi.fn().mockResolvedValue(null),
    }));
    vi.doMock("@/lib/db", () => ({
      getDatabaseMode: () => "turso",
      prisma: {
        user: { count: vi.fn().mockResolvedValue(5) },
      },
    }));

    const { bootstrapTursoIfNeeded } = await import("@/lib/bootstrapTurso");
    await bootstrapTursoIfNeeded();

    expect(seedDatabase).not.toHaveBeenCalled();
  });
});
