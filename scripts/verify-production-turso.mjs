/**
 * 운영 Vercel 프로젝트가 동일 Turso DB를 쓰는지, ClassRoom API가 배포됐는지 확인
 * node scripts/verify-production-turso.mjs
 */
const URLS = [
  "https://deoki-happy-bank.vercel.app",
  "https://haengbok-buja-daycare.vercel.app",
  "https://project-ht10y.vercel.app",
];

const TEACHER = { email: "teacher@haengbok.local", password: "1234", expectedRole: "TEACHER" };

async function login(base) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(TEACHER),
    cache: "no-store",
  });
  const cookie = res.headers.get("set-cookie")?.split(";")[0] ?? "";
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, cookie, userId: json.user?.id ?? null };
}

async function health(base) {
  const res = await fetch(`${base}/api/health/db`, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function classesApi(base, cookie) {
  const res = await fetch(`${base}/api/classes`, {
    headers: cookie ? { Cookie: cookie } : {},
    cache: "no-store",
  });
  const text = await res.text();
  const isJson = text.startsWith("{") || text.startsWith("[");
  return { status: res.status, isJson, preview: text.slice(0, 80) };
}

async function main() {
  console.log("=== 운영 Turso / 배포 상태 점검 ===\n");

  const results = [];
  for (const base of URLS) {
    const h = await health(base);
    const loginResult = await login(base);
    const classes = await classesApi(base, loginResult.cookie);
    results.push({ base, h, loginResult, classes });
  }

  for (const { base, h, loginResult, classes } of results) {
    console.log(`\n${base}`);
    console.log(`  health/db: HTTP ${h.status}`, h.status === 200 ? h.json : h.json);
    console.log(`  teacher login: HTTP ${loginResult.status}, userId=${loginResult.userId}`);
    console.log(`  /api/classes: HTTP ${classes.status}`, classes.isJson ? "(JSON API)" : `(HTML/404: ${classes.preview})`);
  }

  const userIds = [...new Set(results.map((r) => r.loginResult.userId).filter(Boolean))];
  console.log("\n--- Turso DB 통합 여부 ---");
  if (userIds.length <= 1) {
    console.log(`✅ 동일 DB 사용 (teacher userId: ${userIds[0] ?? "unknown"})`);
  } else {
    console.log(`❌ 서로 다른 Turso DB 사용 중 (${userIds.length}개 userId)`);
    results.forEach((r) => console.log(`   ${r.base} → ${r.loginResult.userId}`));
    console.log("\n   → Vercel 프로젝트를 deoki-happy-bank 하나로 통합하고 동일 Turso env를 설정하세요.");
  }

  const primary = results.find((r) => r.base.includes("deoki-happy-bank"));
  const healthOk = primary?.h.status === 200 && primary.h.json.mode === "turso";
  const classesOk = primary?.classes.status === 200 && primary.classes.isJson;

  console.log("\n--- deoki-happy-bank 배포 상태 ---");
  console.log(healthOk ? "✅ /api/health/db (Turso)" : "❌ /api/health/db 미배포 또는 Turso 미연결");
  console.log(classesOk ? "✅ /api/classes API 배포됨" : "❌ /api/classes 미배포 (ClassRoom 기능 없음)");

  if (!healthOk || !classesOk || userIds.length > 1) {
    process.exit(1);
  }

  console.log("\n✅ 운영 환경 사전 점검 통과 — 영속성 테스트 실행 가능");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
