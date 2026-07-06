/**
 * 반(클래스) 영속성 10단계 테스트
 * node scripts/test-class-persistence.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";
const TEACHER = { email: "teacher@haengbok.local", password: "1234", expectedRole: "TEACHER" };
const PARENT = { email: "parent@haengbok.local", password: "1234", expectedRole: "PARENT" };

let cookie = "";
const className = `반검증-${Date.now()}`;

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
  return { ok: res.ok, json: await res.json().catch(() => ({})) };
}

function hasClass(data, name) {
  return data.json?.classes?.some((c) => c.name === name);
}

function step(n, label, pass, detail = "") {
  const mark = pass ? "✅" : "❌";
  console.log(`${mark} ${n}. ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) throw new Error(`Step ${n} failed: ${label}`);
}

async function main() {
  let classId = "";

  console.log("=== 반 영속성 10단계 테스트 ===\n");

  cookie = "";
  step(1, "교사 로그인", (await api("/api/auth/login", { method: "POST", body: JSON.stringify(TEACHER) })).ok);

  const created = await api("/api/classes", { method: "POST", body: JSON.stringify({ name: className }) });
  step(2, "반 생성", created.ok, className);
  classId = created.json.class?.id ?? "";

  const afterCreate = await api("/api/classes");
  step(3, "새로고침 (/api/classes)", hasClass(afterCreate, className));

  const data1 = await api("/api/data");
  step(4, "반 유지 확인 (/api/data)", hasClass(data1, className));

  step(5, "로그아웃", (await api("/api/auth/logout", { method: "POST" })).ok);

  cookie = "";
  step(6, "다시 로그인", (await api("/api/auth/login", { method: "POST", body: JSON.stringify(TEACHER) })).ok);
  const afterRelogin = await api("/api/data");
  step(7, "반 유지 확인", hasClass(afterRelogin, className), `id=${classId}`);

  cookie = "";
  step(8, "학부모 로그인", (await api("/api/auth/login", { method: "POST", body: JSON.stringify(PARENT) })).ok);
  step(8, "학부모 로그아웃", (await api("/api/auth/logout", { method: "POST" })).ok);

  cookie = "";
  step(9, "교사 다시 로그인", (await api("/api/auth/login", { method: "POST", body: JSON.stringify(TEACHER) })).ok);

  const final = await api("/api/data");
  step(10, "반 유지 확인", hasClass(final, className));

  console.log("\n✅ 10단계 테스트 전체 통과");
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
