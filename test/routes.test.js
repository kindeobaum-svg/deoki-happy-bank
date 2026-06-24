import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_ROUTE_PREFIXES, isAdminPath, normalizePathname } from "../src/routes.js";

describe("admin routes", () => {
  it("normalizes trailing slashes without changing the root route", () => {
    assert.equal(normalizePathname("/"), "/");
    assert.equal(normalizePathname("/director/"), "/director");
    assert.equal(normalizePathname("/teacher///"), "/teacher");
  });

  it("treats admin, director, principal, and teacher paths as manager routes", () => {
    for (const route of ADMIN_ROUTE_PREFIXES) {
      assert.equal(isAdminPath(route), true);
      assert.equal(isAdminPath(`${route}/`), true);
      assert.equal(isAdminPath(`${route}/login`), true);
    }
  });

  it("keeps the parent app on the root route", () => {
    assert.equal(isAdminPath("/"), false);
    assert.equal(isAdminPath("/parent"), false);
  });
});
