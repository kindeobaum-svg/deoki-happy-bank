import { describe, expect, it } from "vitest";
import { APP_LOCAL_STORAGE_KEYS } from "@/lib/clientStorage";
import { clearSessionCookieOptions, sessionCookieOptions } from "@/lib/auth";

describe("sessionCookieOptions", () => {
  it("does not set persistent maxAge", () => {
    expect(sessionCookieOptions()).not.toHaveProperty("maxAge");
    expect(sessionCookieOptions().httpOnly).toBe(true);
  });

  it("clears cookie on logout", () => {
    expect(clearSessionCookieOptions().maxAge).toBe(0);
  });
});

describe("APP_LOCAL_STORAGE_KEYS", () => {
  it("includes passbook and teacher storage keys", () => {
    expect(APP_LOCAL_STORAGE_KEYS).toContain("haengbok-local-passbook");
    expect(APP_LOCAL_STORAGE_KEYS).toContain("haengbok-teacher-classes");
  });
});
