/**
 * 재배포 후에도 반 데이터가 유지되는지 검증
 * node scripts/test-redeploy-persistence.mjs [baseUrl]
 *
 * 사전: Turso 모드에서 반 1개 생성 후 실행
 */
const BASE = process.argv[2] ?? "https://deoki-happy-bank.vercel.app";
const TEACHER = { email: "teacher@haengbok.local", password: "1234", expectedRole: "TEACHER" };
const MARKER = `재배포검증-${process.argv[3] ?? Date.now()}`;

let cookie = "";

async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { ...options, headers, cache: "no-store" });
  const sc = res.headers.get("set-cookie");
  if (sc) cookie = sc.split(";")[0];
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  console.log(`=== 재배포 영속성 검증: ${BASE} ===`);
  console.log(`마커 반 이름: ${MARKER}\n`);

  const health = await api("/api/health/db");
  if (health.json.mode !== "turso" || !health.json.tursoConfigured) {
    throw new Error(`Turso 미연결: ${JSON.stringify(health.json)}`);
  }
  console.log("✅ Turso 모드 확인");

  cookie = "";
  if (!(await api("/api/auth/login", { method: "POST", body: JSON.stringify(TEACHER) })).ok) {
    throw new Error("교사 로그인 실패");
  }
  console.log("✅ 교사 로그인");

  const created = await api("/api/classes", { method: "POST", body: JSON.stringify({ name: MARKER }) });
  if (!created.ok) throw new Error("반 생성 실패");
  console.log("✅ 반 생성:", MARKER);

  await api("/api/auth/logout", { method: "POST" });
  cookie = "";
  if (!(await api("/api/auth/login", { method: "POST", body: JSON.stringify(TEACHER) })).ok) {
    throw new Error("재로그인 실패");
  }
  const afterRelogin = await api("/api/data");
  if (!afterRelogin.json.classes?.some((c) => c.name === MARKER)) {
    throw new Error("재로그인 후 반 유실");
  }
  console.log("✅ 로그아웃 → 재로그인 후 반 유지");

  console.log("\n⏳ 이제 Vercel에서 Redeploy를 실행하세요.");
  console.log("   Redeploy 완료 후 아래 명령으로 마커 반 유지 확인:\n");
  console.log(`   MARKER="${MARKER}" node scripts/verify-marker-after-redeploy.mjs ${BASE}`);
  console.log("\n또는 configure-vercel-turso.mjs 가 redeploy까지 자동 실행한 경우,");
  console.log("30초 후 자동 재확인을 시작합니다...\n");

  await new Promise((r) => setTimeout(r, 45_000));

  for (let i = 0; i < 20; i++) {
    cookie = "";
    await api("/api/auth/login", { method: "POST", body: JSON.stringify(TEACHER) });
    const data = await api("/api/data");
    const found = data.json.classes?.some((c) => c.name === MARKER);
    const h = await api("/api/health/db");
    console.log(`  [${i + 1}] mode=${h.json.mode}, 반유지=${found}`);
    if (found && h.json.mode === "turso") {
      console.log("\n✅ 재배포 후에도 반 데이터 유지 확인");
      return;
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
  throw new Error("재배포 후 반 데이터 미확인 (Redeploy 완료 여부 확인)");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
