import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { ADMIN_ROUTE_PREFIXES } from "../src/routes.js";

describe("vercel rewrites", () => {
  it("rewrites every manager route alias to the single page app", async () => {
    const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
    const rewrites = new Map(config.rewrites.map((rewrite) => [rewrite.source, rewrite.destination]));

    for (const route of ADMIN_ROUTE_PREFIXES) {
      assert.equal(rewrites.get(route), "/");
      assert.equal(rewrites.get(`${route}/`), "/");
      assert.equal(rewrites.get(`${route}/:path*`), "/");
    }
  });
});
