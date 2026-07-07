/**
 * Vercel deoki-happy-bank에 Turso 환경변수 설정 + Redeploy + 검증
 *
 * 필요 env (Cursor Secrets 또는 로컬):
 *   VERCEL_TOKEN
 *   TURSO_DATABASE_URL
 *   TURSO_AUTH_TOKEN
 *   DATABASE_URL (없으면 TURSO_* 로 자동 생성)
 *
 * node scripts/configure-vercel-turso.mjs
 */
const PROJECT = "deoki-happy-bank";
const TEAM = process.env.VERCEL_TEAM_ID || ""; // optional
const BASE = "https://deoki-happy-bank.vercel.app";

const token = process.env.VERCEL_TOKEN;
const tursoUrl = (process.env.TURSO_DATABASE_URL ?? "").replace(/\?.*$/, "");
const tursoToken = process.env.TURSO_AUTH_TOKEN ?? "";
let databaseUrl = process.env.DATABASE_URL ?? "";

if (!token) {
  console.error("❌ VERCEL_TOKEN 이 필요합니다.");
  process.exit(1);
}
if (!tursoUrl.startsWith("libsql:") || !tursoToken) {
  console.error("❌ TURSO_DATABASE_URL + TURSO_AUTH_TOKEN 이 필요합니다.");
  process.exit(1);
}
if (!databaseUrl.startsWith("libsql:")) {
  databaseUrl = `${tursoUrl}?authToken=${encodeURIComponent(tursoToken)}`;
}

const apiBase = TEAM
  ? `https://api.vercel.com/v10/projects/${PROJECT}?teamId=${TEAM}`
  : `https://api.vercel.com/v10/projects/${PROJECT}`;

async function vercel(path, options = {}) {
  const url = path.startsWith("http")
    ? path
    : `https://api.vercel.com${path}${TEAM ? (path.includes("?") ? "&" : "?") + `teamId=${TEAM}` : ""}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Vercel API ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function upsertEnv(key, value, targets) {
  // list existing
  const listPath = `/v9/projects/${PROJECT}/env${TEAM ? `?teamId=${TEAM}` : ""}`;
  const existing = await vercel(listPath);
  const found = (existing.envs ?? []).find((e) => e.key === key);

  const body = {
    key,
    value,
    type: "encrypted",
    target: targets,
  };

  if (found) {
    const patchPath = `/v9/projects/${PROJECT}/env/${found.id}${TEAM ? `?teamId=${TEAM}` : ""}`;
    await vercel(patchPath, { method: "PATCH", body: JSON.stringify(body) });
    console.log(`  ✓ updated ${key}`);
  } else {
    const postPath = `/v10/projects/${PROJECT}/env${TEAM ? `?teamId=${TEAM}` : ""}`;
    await vercel(postPath, { method: "POST", body: JSON.stringify(body) });
    console.log(`  ✓ created ${key}`);
  }
}

async function redeploy() {
  const project = await vercel(apiBase.replace("https://api.vercel.com", ""));
  const deploymentsPath = `/v6/deployments?projectId=${project.id}&limit=1${TEAM ? `&teamId=${TEAM}` : ""}`;
  const { deployments } = await vercel(deploymentsPath);
  const latest = deployments?.[0];
  if (!latest) throw new Error("No deployments found");

  const redeployPath = `/v13/deployments${TEAM ? `?teamId=${TEAM}` : ""}`;
  const result = await vercel(redeployPath, {
    method: "POST",
    body: JSON.stringify({
      name: PROJECT,
      deploymentId: latest.uid,
      target: "production",
    }),
  });
  console.log(`  ✓ redeploy triggered: ${result.url ?? result.id ?? "ok"}`);
  return result;
}

async function waitForTurso(maxMs = 300_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const res = await fetch(`${BASE}/api/health/db`, { cache: "no-store" });
    const json = await res.json();
    console.log(`  health: mode=${json.mode}, tursoConfigured=${json.tursoConfigured}`);
    if (json.mode === "turso" && json.tursoConfigured === true) return json;
    await new Promise((r) => setTimeout(r, 15_000));
  }
  throw new Error("Timeout waiting for Turso mode");
}

async function main() {
  console.log("=== 1) Vercel 환경변수 설정 (Production + Preview) ===\n");
  const targets = ["production", "preview"];
  await upsertEnv("TURSO_DATABASE_URL", tursoUrl, targets);
  await upsertEnv("TURSO_AUTH_TOKEN", tursoToken, targets);
  await upsertEnv("DATABASE_URL", databaseUrl, targets);

  console.log("\n=== 2) Production Redeploy ===\n");
  await redeploy();

  console.log("\n=== 3) Turso 모드 전환 대기 ===\n");
  const health = await waitForTurso();
  console.log("\n✅ health/db:", JSON.stringify(health));

  console.log("\n=== 4) verify-production-turso.mjs ===\n");
  const { execSync } = await import("node:child_process");
  execSync("node scripts/verify-production-turso.mjs", { stdio: "inherit" });

  console.log("\n=== 5) test-production-persistence.mjs ===\n");
  execSync(`node scripts/test-production-persistence.mjs ${BASE}`, { stdio: "inherit" });

  console.log("\n✅ Turso 설정 + 검증 스크립트 완료");
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
