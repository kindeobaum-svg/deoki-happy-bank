import { afterEach, describe, expect, it, vi } from "vitest";

describe("getTursoConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses TURSO_* when auth token is a valid JWT", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "libsql://test-db.turso.io");
    vi.stubEnv("TURSO_AUTH_TOKEN", "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDAwMDB9.sig");
    vi.stubEnv("DATABASE_URL", "");

    const { getTursoConfig } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()).toEqual({
      url: "libsql://test-db.turso.io",
      authToken: "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDAwMDB9.sig",
    });
  });

  it("falls back to DATABASE_URL authToken when TURSO_AUTH_TOKEN is a bare libsql URL", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "libsql://test-db.turso.io");
    vi.stubEnv("TURSO_AUTH_TOKEN", "libsql://test-db.turso.io");
    vi.stubEnv(
      "DATABASE_URL",
      "libsql://test-db.turso.io?authToken=eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDAwMDB9.sig",
    );

    const { getTursoConfig } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()?.authToken).toBe("eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDAwMDB9.sig");
  });

  it("returns null when Turso URL is set but no valid JWT exists anywhere", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "libsql://test-db.turso.io");
    vi.stubEnv("TURSO_AUTH_TOKEN", "libsql://test-db.turso.io");
    vi.stubEnv("DATABASE_URL", "libsql://test-db.turso.io");

    const { getTursoConfig, isTursoEnvDeclared } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()).toBeNull();
    expect(isTursoEnvDeclared()).toBe(true);
  });

  it("uses DATABASE_URL alone when TURSO_* is not set", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "");
    vi.stubEnv("TURSO_AUTH_TOKEN", "");
    vi.stubEnv(
      "DATABASE_URL",
      "libsql://test-db.turso.io?authToken=eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDAwMDB9.sig",
    );

    const { getTursoConfig } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()).toEqual({
      url: "libsql://test-db.turso.io",
      authToken: "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDAwMDB9.sig",
    });
  });
});
