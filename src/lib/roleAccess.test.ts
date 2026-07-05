import { describe, expect, it } from "vitest";
import {
  findPathRule,
  getHomeForRole,
  isPathAllowedForRole,
  isDirectorOnlyPath,
  normalizePathname,
} from "@/lib/roleAccess";

describe("normalizePathname", () => {
  it("collapses duplicate slashes", () => {
    expect(normalizePathname("/admin/director/admin/director/")).toBe("/admin/director/admin/director");
  });
});

describe("isPathAllowedForRole", () => {
  it("allows only director on /admin paths", () => {
    expect(isPathAllowedForRole("/admin", "DIRECTOR")).toBe(true);
    expect(isPathAllowedForRole("/admin", "PARENT")).toBe(false);
    expect(isPathAllowedForRole("/admin/director/admin/director", "PARENT")).toBe(false);
    expect(isPathAllowedForRole("/admin/director/admin/director", "TEACHER")).toBe(false);
  });

  it("allows parent on /parent paths", () => {
    expect(isPathAllowedForRole("/parent", "PARENT")).toBe(true);
    expect(isPathAllowedForRole("/parent/diary", "PARENT")).toBe(true);
    expect(isPathAllowedForRole("/parent", "TEACHER")).toBe(false);
  });

  it("blocks parent on /teacher paths", () => {
    expect(isPathAllowedForRole("/teacher", "PARENT")).toBe(false);
  });

  it("blocks director on /passbook and /parent paths", () => {
    expect(isPathAllowedForRole("/passbook", "DIRECTOR")).toBe(false);
    expect(isPathAllowedForRole("/parent", "DIRECTOR")).toBe(false);
    expect(isPathAllowedForRole("/parent/diary", "DIRECTOR")).toBe(false);
  });

  it("allows director on /teacher for class management", () => {
    expect(isPathAllowedForRole("/teacher", "DIRECTOR")).toBe(true);
  });

  it("blocks parent on /director paths", () => {
    expect(isPathAllowedForRole("/director", "PARENT")).toBe(false);
    expect(isPathAllowedForRole("/director/settings", "DIRECTOR")).toBe(true);
  });
});

describe("findPathRule", () => {
  it("matches nested admin paths to admin rule", () => {
    expect(findPathRule("/admin/foo")?.prefix).toBe("/admin");
  });
});

describe("getHomeForRole", () => {
  it("returns passbook for parent", () => {
    expect(getHomeForRole("PARENT")).toBe("/passbook");
  });
});

describe("isDirectorOnlyPath", () => {
  it("detects director-only urls", () => {
    expect(isDirectorOnlyPath("/admin/director/admin/director")).toBe(true);
    expect(isDirectorOnlyPath("/parent")).toBe(false);
  });
});
