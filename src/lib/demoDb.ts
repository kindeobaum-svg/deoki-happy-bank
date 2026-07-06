import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TMP_DB = path.join(os.tmpdir(), "haengbok-demo.db");

const EXPLICIT_BUNDLED_PATHS = [
  "/var/task/prisma/demo.db",
  path.join(/* turbopackIgnore: true */ process.cwd(), "prisma", "demo.db"),
];

function resolveBundledDemoDbPath(): string | null {
  for (const candidate of EXPLICIT_BUNDLED_PATHS) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const relative = path.join("prisma", "demo.db");
  const legacyRelative = path.join("prisma", "prisma", "demo.db");
  const searchRoots = new Set<string>([process.cwd(), "/var/task"]);

  try {
    if (typeof __dirname === "string") searchRoots.add(__dirname);
  } catch {
    // ignore
  }

  for (const start of searchRoots) {
    let root = start;
    for (let depth = 0; depth < 8; depth++) {
      for (const rel of [relative, legacyRelative]) {
        const candidate = path.join(root, rel);
        if (fs.existsSync(candidate)) return candidate;
      }
      const parent = path.dirname(root);
      if (parent === root) break;
      root = parent;
    }
  }

  return null;
}

/** Vercel cold start: copy bundled SQLite to writable tmp before API traffic */
export function warmDemoDatabase(): string | null {
  if (fs.existsSync(TMP_DB)) {
    return TMP_DB;
  }

  const bundledPath = resolveBundledDemoDbPath();
  if (!bundledPath) {
    console.error("demo.db not found for Vercel warm-up; cwd=", process.cwd());
    return null;
  }

  try {
    fs.copyFileSync(bundledPath, TMP_DB);
    console.log("Vercel demo DB warmed:", bundledPath, "->", TMP_DB);
    return TMP_DB;
  } catch (error) {
    console.error("Failed to warm demo.db on Vercel:", error);
    return null;
  }
}

export function getVercelSqliteUrl(): string | null {
  if (fs.existsSync(TMP_DB)) return `file:${TMP_DB}`;
  const warmed = warmDemoDatabase();
  return warmed ? `file:${warmed}` : null;
}
