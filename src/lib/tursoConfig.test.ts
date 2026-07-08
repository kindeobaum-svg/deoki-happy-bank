import { afterEach, describe, expect, it, vi } from "vitest";

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDAwMDB9.sig";
const DB = "libsql://test-db.turso.io";

describe("getTursoConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses TURSO_* when auth token is a valid JWT", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", DB);
    vi.stubEnv("TURSO_AUTH_TOKEN", JWT);
    vi.stubEnv("DATABASE_URL", "");

    const { getTursoConfig } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()).toEqual({ url: DB, authToken: JWT });
  });

  it("extracts JWT from TURSO_DATABASE_URL when TURSO_AUTH_TOKEN is bare libsql URL", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", `${DB}?authToken=${JWT}`);
    vi.stubEnv("TURSO_AUTH_TOKEN", DB);
    vi.stubEnv("DATABASE_URL", "");

    const { getTursoConfig } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()).toEqual({ url: DB, authToken: JWT });
  });

  it("extracts JWT from TURSO_AUTH_TOKEN when it is a full libsql connection string", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", DB);
    vi.stubEnv("TURSO_AUTH_TOKEN", `${DB}?authToken=${JWT}`);
    vi.stubEnv("DATABASE_URL", "");

    const { getTursoConfig } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()).toEqual({ url: DB, authToken: JWT });
  });

  it("auto-swaps reversed TURSO_DATABASE_URL and TURSO_AUTH_TOKEN", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", JWT);
    vi.stubEnv("TURSO_AUTH_TOKEN", DB);
    vi.stubEnv("DATABASE_URL", "");

    const { getTursoConfig } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()).toEqual({ url: DB, authToken: JWT });
  });

  it("falls back to DATABASE_URL authToken when TURSO_AUTH_TOKEN is a bare libsql URL", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", DB);
    vi.stubEnv("TURSO_AUTH_TOKEN", DB);
    vi.stubEnv("DATABASE_URL", `${DB}?authToken=${JWT}`);

    const { getTursoConfig } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()?.authToken).toBe(JWT);
  });

  it("returns null when Turso URL is set but no valid JWT exists anywhere", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", DB);
    vi.stubEnv("TURSO_AUTH_TOKEN", DB);
    vi.stubEnv("DATABASE_URL", DB);

    const { getTursoConfig, isTursoEnvDeclared } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()).toBeNull();
    expect(isTursoEnvDeclared()).toBe(true);
  });

  it("uses DATABASE_URL alone when TURSO_* is not set", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "");
    vi.stubEnv("TURSO_AUTH_TOKEN", "");
    vi.stubEnv("DATABASE_URL", `${DB}?authToken=${JWT}`);

    const { getTursoConfig } = await import("@/lib/tursoConfig");
    expect(getTursoConfig()).toEqual({ url: DB, authToken: JWT });
  });
});
