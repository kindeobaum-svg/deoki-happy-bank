/**
 * Vercel 프로덕션 DB 영속성 검증 (10단계)
 * node scripts/test-production-persistence.mjs [baseUrl]
 *
 * 기본: https://deoki-happy-bank.vercel.app
 */
const BASE = process.argv[2] ?? "https://deoki-happy-bank.vercel.app";
const TEACHER = { email: "teacher@haengbok.local", password: "1234", expectedRole: "TEACHER" };
const PARENT = { email: "parent@haengbok.local", password: "1234", expectedRole: "PARENT" };

let cookie = "";
const suffix = Date.now();
const className = `운영검증반-${suffix}`;
const childName = `운영검증원아-${suffix}`;
const parentEmail = `prod-${suffix}@test.local`;
const parentPassword = "test1234";

function parseSetCookie(h) {
  return h ? h.split(";")[0] : "";
}

async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { ...options, headers, cache: "no-store" });
  const sc = res.headers.get("set-cookie");
  if (sc) cookie = parseSetCookie(sc);
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, json };
}

function step(n, label, pass, detail = "") {
  const mark = pass ? "✅" : "❌";
  console.log(`${mark} ${n}. ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) throw new Error(`Step ${n} failed: ${label}`);
}

async function main() {
  console.log(`=== 프로덕션 영속성 테스트: ${BASE} ===\n`);

  const health = await api("/api/health/db");
  step(0, "DB 헬스체크", health.ok && health.json.ok === true, JSON.stringify(health.json));
  if (health.json.mode !== "turso") {
    throw new Error(`Turso 미사용: mode=${health.json.mode}`);
  }
  console.log(`   Turso: ${health.json.tursoHost}, ClassRoom=${health.json.counts?.classRoom}\n`);

  cookie = "";
  step(1, "교사 로그인", (await api("/api/auth/login", { method: "POST", body: JSON.stringify(TEACHER) })).ok);

  const created = await api("/api/classes", { method: "POST", body: JSON.stringify({ name: className }) });
  step(2, "반 생성", created.ok, className);
  const classId = created.json.class?.id ?? "";

  step(3, "새로고침 (/api/classes)", hasClass(await api("/api/classes"), className));
  step(4, "반 유지 (/api/data)", hasClass(await api("/api/data"), className));

  const child = await api("/api/children", { method: "POST", body: JSON.stringify({ name: childName, className }) });
  step(4, "원아 추가", child.ok, childName);
  const childId = child.json.child?.id ?? "";

  const inv = await api("/api/invites", { method: "POST", body: JSON.stringify({ targetRole: "PARENT", childId }) });
  step(4, "초대코드 생성", inv.ok);
  const inviteCode = inv.json.invite?.code ?? "";

  cookie = "";
  const join = await api("/api/invites/redeem", {
    method: "POST",
    body: JSON.stringify({ code: inviteCode, email: parentEmail, password: parentPassword, name: "운영검증학부모" }),
  });
  step(5, "학부모 가입", join.ok && join.json.user?.childId === childId);

  step(6, "교사 로그아웃", (await api("/api/auth/logout", { method: "POST" })).ok);
  cookie = "";
  step(6, "교사 재로그인", (await api("/api/auth/login", { method: "POST", body: JSON.stringify(TEACHER) })).ok);
  step(7, "재로그인 후 반 유지", hasClass(await api("/api/data"), className));
  step(7, "재로그인 후 원아 유지", (await api("/api/data")).json.children?.some((c) => c.id === childId));

  cookie = "";
  step(8, "학부모 로그인", (await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: parentEmail, password: parentPassword, expectedRole: "PARENT" }) })).ok);
  step(8, "학부모 연결 확인", (await api("/api/auth/parent-home")).json.parentSession?.childId === childId);
  step(8, "학부모 로그아웃", (await api("/api/auth/logout", { method: "POST" })).ok);

  cookie = "";
  step(9, "교사 재로그인", (await api("/api/auth/login", { method: "POST", body: JSON.stringify(TEACHER) })).ok);
  const final = await api("/api/data");
  step(10, "최종 반·원아·초대코드 유지", hasClass(final, className) && final.json.children?.some((c) => c.id === childId));

  const healthAfter = await api("/api/health/db");
  console.log(`\n   DB after test: ClassRoom=${healthAfter.json.counts?.classRoom}, Child=${healthAfter.json.counts?.child}`);

  console.log("\n✅ 프로덕션 10단계 영속성 테스트 통과");
}

function hasClass(data, name) {
  return data.json?.classes?.some((c) => c.name === name);
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
