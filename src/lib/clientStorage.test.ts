import { describe, expect, it } from "vitest";
import { APP_LOCAL_STORAGE_KEYS, clearAppClientStorage } from "@/lib/clientStorage";
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
  it("does not clear business data keys", () => {
    expect(APP_LOCAL_STORAGE_KEYS).toHaveLength(0);
  });
});

describe("clearAppClientStorage", () => {
  it("is a no-op (DB holds class/child/passbook data)", () => {
    expect(() => clearAppClientStorage()).not.toThrow();
  });
});
