import { describe, expect, it, vi, afterEach } from "vitest";

describe("getDatabaseMode turso detection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses turso when DATABASE_URL is libsql with authToken on Vercel", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("TURSO_DATABASE_URL", "libsql://test-db.turso.io");
    vi.stubEnv("TURSO_AUTH_TOKEN", "token");
    vi.stubEnv(
      "DATABASE_URL",
      "libsql://test-db.turso.io?authToken=test-token-value",
    );

    const { getDatabaseMode } = await import("@/lib/db");
    expect(getDatabaseMode()).toBe("turso");
  });

  it("uses turso on Vercel when only DATABASE_URL has libsql with authToken", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("TURSO_DATABASE_URL", "");
    vi.stubEnv("TURSO_AUTH_TOKEN", "");
    vi.stubEnv("DATABASE_URL", "libsql://test-db.turso.io?authToken=test-token-value");

    const { getDatabaseMode } = await import("@/lib/db");
    expect(getDatabaseMode()).toBe("turso");
  });

  it("falls back to vercel-sqlite on Vercel without any Turso config", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("TURSO_DATABASE_URL", "");
    vi.stubEnv("TURSO_AUTH_TOKEN", "");
    vi.stubEnv("DATABASE_URL", "");

    const { getDatabaseMode } = await import("@/lib/db");
    expect(getDatabaseMode()).toBe("vercel-sqlite");
  });

  it("uses sqlite locally without turso config", async () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("DATABASE_URL", "file:./dev.db");
    vi.stubEnv("TURSO_DATABASE_URL", "");
    vi.stubEnv("TURSO_AUTH_TOKEN", "");

    const { getDatabaseMode } = await import("@/lib/db");
    expect(getDatabaseMode()).toBe("sqlite");
  });

  it("allows Vercel build phase without Turso env (placeholder DB)", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("TURSO_DATABASE_URL", "");
    vi.stubEnv("TURSO_AUTH_TOKEN", "");

    const { getDatabaseMode, prisma } = await import("@/lib/db");
    expect(getDatabaseMode()).toBe("vercel-sqlite");
    expect(prisma).toBeDefined();
  });
});
