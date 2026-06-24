import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

await rm(dist, { force: true, recursive: true });
await mkdir(dist, { recursive: true });

let appVersion = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.APP_VERSION ?? "";
if (!appVersion) {
  try {
    appVersion = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    appVersion = String(Date.now());
  }
}

const html = await readFile(resolve(root, "index.html"), "utf8");
const htmlWithVersion = html.replaceAll("__APP_VERSION__", encodeURIComponent(appVersion));
await writeFile(resolve(dist, "index.html"), htmlWithVersion);
await mkdir(resolve(dist, "admin", "director"), { recursive: true });
await mkdir(resolve(dist, "admin", "teacher"), { recursive: true });
await writeFile(resolve(dist, "admin", "index.html"), htmlWithVersion);
await writeFile(resolve(dist, "admin", "director", "index.html"), htmlWithVersion);
await writeFile(resolve(dist, "admin", "teacher", "index.html"), htmlWithVersion);
await cp(resolve(root, "src"), resolve(dist, "src"), { recursive: true });

console.log(`Static app built in dist/ (${appVersion})`);
