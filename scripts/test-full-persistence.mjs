/**
 * 8단계 영속성 테스트 (교사 + 학부모)
 * node scripts/test-full-persistence.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";
const TEACHER = { email: "teacher@haengbok.local", password: "1234" };

let cookie = "";
const suffix = Date.now();
const className = `최종검증반-${suffix}`;
const childName = `최종검증원아-${suffix}`;
const parentEmail = `final-${suffix}@test.local`;
const parentPassword = "test1234";

function parseSetCookie(h) {
  return h ? h.split(";")[0] : "";
}

async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const sc = res.headers.get("set-cookie");
  if (sc) cookie = parseSetCookie(sc);
  return { ok: res.ok, json: await res.json().catch(() => ({})) };
}

function assert(c, m) {
  if (!c) throw new Error(m);
}

async function main() {
  console.log("1. 교사 로그인");
  assert((await api("/api/auth/login", { method: "POST", body: JSON.stringify({ ...TEACHER, expectedRole: "TEACHER" }) })).ok, "교사 로그인 실패");

  console.log("2. 반 생성");
  const cls = await api("/api/classes", { method: "POST", body: JSON.stringify({ name: className }) });
  assert(cls.ok, "반 생성 실패");
  const classId = cls.json.class.id;

  console.log("3. 원아 추가");
  const ch = await api("/api/children", { method: "POST", body: JSON.stringify({ name: childName, className }) });
  assert(ch.ok, "원아 추가 실패");
  const childId = ch.json.child.id;

  console.log("4. 초대코드 생성");
  const inv = await api("/api/invites", { method: "POST", body: JSON.stringify({ targetRole: "PARENT", childId }) });
  assert(inv.ok, "초대코드 생성 실패");
  const inviteCode = inv.json.invite.code;

  console.log("5. 학부모 가입");
  cookie = "";
  const join = await api("/api/invites/redeem", {
    method: "POST",
    body: JSON.stringify({ code: inviteCode, email: parentEmail, password: parentPassword, name: "최종검증학부모" }),
  });
  assert(join.ok, "학부모 가입 실패");
  assert(join.json.user?.childId === childId, "User.childId 저장 실패");

  console.log("6. 교사 로그아웃 → 재로그인");
  await api("/api/auth/logout", { method: "POST" });
  cookie = "";
  assert((await api("/api/auth/login", { method: "POST", body: JSON.stringify({ ...TEACHER, expectedRole: "TEACHER" }) })).ok, "교사 재로그인 실패");
  const tData = await api("/api/data");
  assert(tData.json.classes?.some((c) => c.id === classId), "교사 재로그인 후 반 없음");
  assert(tData.json.children?.some((c) => c.id === childId), "교사 재로그인 후 원아 없음");

  console.log("7. 학부모 로그아웃 → 재로그인");
  await api("/api/auth/logout", { method: "POST" });
  cookie = "";
  assert((await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: parentEmail, password: parentPassword, expectedRole: "PARENT" }) })).ok, "학부모 재로그인 실패");
  const pHome = await api("/api/auth/parent-home");
  assert(pHome.json.parentSession?.childId === childId, "학부모 재로그인 후 childId 없음");
  const pData = await api("/api/data");
  assert(pData.json.children?.some((c) => c.id === childId), "학부모 재로그인 후 원아 없음");

  console.log("8. 교사 재로그인 → 반/원아/초대코드 유지");
  await api("/api/auth/logout", { method: "POST" });
  cookie = "";
  assert((await api("/api/auth/login", { method: "POST", body: JSON.stringify({ ...TEACHER, expectedRole: "TEACHER" }) })).ok, "교사 2차 재로그인 실패");
  const t2 = await api("/api/data");
  assert(t2.json.classes?.some((c) => c.id === classId), "최종: 반 없음");
  assert(t2.json.children?.some((c) => c.id === childId), "최종: 원아 없음");
  cookie = "";
  const verify = await api("/api/invites/verify", { method: "POST", body: JSON.stringify({ code: inviteCode }) });
  assert(!verify.ok, "사용된 초대코드는 invalid여야 함");
  const parentUser = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: parentEmail, password: parentPassword, expectedRole: "PARENT" }) });
  assert(parentUser.json.user?.childId === childId, "최종: 학부모 연결 없음");

  console.log("\n✅ 8단계 테스트 전체 통과");
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
