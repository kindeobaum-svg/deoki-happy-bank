import { describe, expect, it } from "vitest";
import {
  findPathRule,
  getHomeForRole,
  isPathAllowedForRole,
  isDirectorOnlyPath,
  isTeacherOnlyApi,
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

  it("allows only teacher on /teacher paths", () => {
    expect(isPathAllowedForRole("/teacher", "TEACHER")).toBe(true);
    expect(isPathAllowedForRole("/teacher", "PARENT")).toBe(false);
    expect(isPathAllowedForRole("/teacher", "DIRECTOR")).toBe(false);
  });

  it("allows parent on /parent and /passbook paths", () => {
    expect(isPathAllowedForRole("/parent", "PARENT")).toBe(true);
    expect(isPathAllowedForRole("/parent/diary", "PARENT")).toBe(true);
    expect(isPathAllowedForRole("/passbook", "PARENT")).toBe(true);
    expect(isPathAllowedForRole("/parent", "TEACHER")).toBe(false);
    expect(isPathAllowedForRole("/passbook", "TEACHER")).toBe(false);
  });

  it("blocks parent on /director paths", () => {
    expect(isPathAllowedForRole("/director", "PARENT")).toBe(false);
    expect(isPathAllowedForRole("/director/settings", "DIRECTOR")).toBe(true);
  });

  it("allows only child on /child paths", () => {
    expect(isPathAllowedForRole("/child", "CHILD")).toBe(true);
    expect(isPathAllowedForRole("/child", "PARENT")).toBe(false);
    expect(isPathAllowedForRole("/child", "TEACHER")).toBe(false);
  });
});

describe("findPathRule", () => {
  it("matches nested admin paths to admin rule", () => {
    expect(findPathRule("/admin/foo")?.prefix).toBe("/admin");
  });
});

describe("getHomeForRole", () => {
  it("returns role-specific home paths", () => {
    expect(getHomeForRole("PARENT")).toBe("/parent");
    expect(getHomeForRole("TEACHER")).toBe("/teacher");
    expect(getHomeForRole("DIRECTOR")).toBe("/admin");
    expect(getHomeForRole("CHILD")).toBe("/child");
  });
});

describe("isDirectorOnlyPath", () => {
  it("detects director-only urls", () => {
    expect(isDirectorOnlyPath("/admin/director/admin/director")).toBe(true);
    expect(isDirectorOnlyPath("/parent")).toBe(false);
  });
});

describe("isTeacherOnlyApi", () => {
  it("protects teacher management APIs", () => {
    expect(isTeacherOnlyApi("/api/classes")).toBe(true);
    expect(isTeacherOnlyApi("/api/children/abc")).toBe(true);
    expect(isTeacherOnlyApi("/api/invites")).toBe(false);
    expect(isTeacherOnlyApi("/api/data")).toBe(false);
  });
});
