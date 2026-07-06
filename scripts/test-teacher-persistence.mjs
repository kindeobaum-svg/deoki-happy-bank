/**
 * 교사 반/원아/초대코드 DB 영속성 통합 테스트
 * 사용: node scripts/test-teacher-persistence.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";
const TEACHER = { email: "teacher@haengbok.local", password: "1234" };

let cookie = "";

function parseSetCookie(header) {
  if (!header) return "";
  const part = header.split(";")[0];
  return part;
}

async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    cookie = parseSetCookie(setCookie);
  }
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(email, password, expectedRole) {
  const res = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, expectedRole }),
  });
  assert(res.ok, `로그인 실패 (${email}): ${JSON.stringify(res.json)}`);
  return res.json;
}

async function logout() {
  const res = await api("/api/auth/logout", { method: "POST" });
  assert(res.ok, `로그아웃 실패: ${JSON.stringify(res.json)}`);
  cookie = "";
}

async function main() {
  const suffix = Date.now();
  const className = `테스트반-${suffix}`;
  const childName = `테스트원아-${suffix}`;
  const parentEmail = `parent-test-${suffix}@test.local`;
  const parentPassword = "test1234";

  console.log("1. 교사 로그인");
  await login(TEACHER.email, TEACHER.password, "TEACHER");

  console.log("2. 반 생성");
  const createClass = await api("/api/classes", {
    method: "POST",
    body: JSON.stringify({ name: className }),
  });
  assert(createClass.ok, `반 생성 실패: ${JSON.stringify(createClass.json)}`);
  const classId = createClass.json.class.id;

  console.log("3. 원아 추가");
  const createChild = await api("/api/children", {
    method: "POST",
    body: JSON.stringify({ name: childName, className }),
  });
  assert(createChild.ok, `원아 추가 실패: ${JSON.stringify(createChild.json)}`);
  const childId = createChild.json.child.id;

  console.log("4. 초대코드 생성");
  const createInvite = await api("/api/invites", {
    method: "POST",
    body: JSON.stringify({ targetRole: "PARENT", childId }),
  });
  assert(createInvite.ok, `초대코드 생성 실패: ${JSON.stringify(createInvite.json)}`);
  const inviteCode = createInvite.json.invite.code;

  console.log("5. 교사 로그아웃");
  await logout();

  console.log("6. 교사 재로그인");
  await login(TEACHER.email, TEACHER.password, "TEACHER");

  console.log("7. 반/원아 DB 조회 확인");
  const dataAfterRelogin = await api("/api/data");
  assert(dataAfterRelogin.ok, `데이터 조회 실패: ${JSON.stringify(dataAfterRelogin.json)}`);
  const classes = dataAfterRelogin.json.classes ?? [];
  const children = dataAfterRelogin.json.children ?? [];
  assert(
    classes.some((c) => c.id === classId && c.name === className),
    `반 '${className}' 이(가) 재로그인 후 사라짐`,
  );
  assert(
    children.some((c) => c.id === childId && c.name === childName && c.className === className),
    `원아 '${childName}' 이(가) 재로그인 후 사라짐`,
  );
  console.log("   ✓ 반/원아 유지 확인");

  console.log("8. 초대코드 검증");
  cookie = "";
  const verifyInvite = await api("/api/invites/verify", {
    method: "POST",
    body: JSON.stringify({ code: inviteCode }),
  });
  assert(verifyInvite.ok, `초대코드 검증 실패: ${JSON.stringify(verifyInvite.json)}`);
  console.log("   ✓ 초대코드 유효");

  console.log("9. 학부모 가입");
  const redeem = await api("/api/invites/redeem", {
    method: "POST",
    body: JSON.stringify({
      code: inviteCode,
      email: parentEmail,
      password: parentPassword,
      name: "테스트 학부모",
    }),
  });
  assert(redeem.ok, `학부모 가입 실패: ${JSON.stringify(redeem.json)}`);
  console.log("   ✓ 학부모 가입 성공");

  console.log("10. 학부모 로그아웃 후 재로그인");
  await logout();
  const parentLogin = await login(parentEmail, parentPassword, "PARENT");
  assert(parentLogin.user?.childId === childId, "학부모-원아 연결(childId) 없음");

  console.log("11. 학부모 홈/통장 데이터 확인");
  const parentHome = await api("/api/auth/parent-home");
  assert(parentHome.ok, `parent-home 실패: ${JSON.stringify(parentHome.json)}`);
  assert(parentHome.json.linked === true, "parent-home linked=false");
  assert(
    parentHome.json.parentSession?.childId === childId,
    `parent-home childId 불일치: ${JSON.stringify(parentHome.json.parentSession)}`,
  );

  const parentData = await api("/api/data");
  assert(parentData.ok, `학부모 data 조회 실패: ${JSON.stringify(parentData.json)}`);
  assert(
    parentData.json.children.some((c) => c.id === childId),
    "학부모 재로그인 후 원아 통장 데이터 없음",
  );
  console.log("   ✓ 학부모 재로그인 후 원아 연결 유지");

  console.log("\n✅ 전체 테스트 통과");
}

main().catch((err) => {
  console.error("\n❌ 테스트 실패:", err.message);
  process.exit(1);
});
