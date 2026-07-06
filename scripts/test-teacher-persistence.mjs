/**
 * 교사 반/원아 DB 영속성 통합 테스트 (교사↔학부모 교차 포함)
 * 사용: node scripts/test-teacher-persistence.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";
const TEACHER = { email: "teacher@haengbok.local", password: "1234" };
const DEMO_PARENT = { email: "parent@haengbok.local", password: "1234" };

let cookie = "";

function parseSetCookie(header) {
  if (!header) return "";
  return header.split(";")[0];
}

async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = parseSetCookie(setCookie);
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

function hasClassAndChild(data, classId, className, childId, childName) {
  const classes = data.classes ?? [];
  const children = data.children ?? [];
  return (
    classes.some((c) => c.id === classId && c.name === className) &&
    children.some((c) => c.id === childId && c.name === childName && c.className === className)
  );
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

  console.log("5. 교사 로그아웃 → 재로그인");
  await logout();
  await login(TEACHER.email, TEACHER.password, "TEACHER");

  console.log("6. 반/원아 DB 유지 확인 (교사 재로그인)");
  let teacherData = await api("/api/data");
  assert(teacherData.ok, `데이터 조회 실패: ${JSON.stringify(teacherData.json)}`);
  assert(
    hasClassAndChild(teacherData.json, classId, className, childId, childName),
    `교사 재로그인 후 반/원아 사라짐`,
  );
  console.log("   ✓ 교사 재로그인 후 반/원아 유지");

  console.log("7. 학부모 가입");
  cookie = "";
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

  console.log("8. 학부모 로그아웃 → 재로그인");
  await logout();
  await login(parentEmail, parentPassword, "PARENT");
  const parentData = await api("/api/data");
  assert(parentData.ok, `학부모 data 조회 실패`);
  assert(
    parentData.json.children.some((c) => c.id === childId),
    "학부모 재로그인 후 원아 없음",
  );
  console.log("   ✓ 학부모 재로그인 후 원아 유지");

  console.log("9. 데모 학부모 로그인/로그아웃 (교사 데이터 영향 없어야 함)");
  await logout();
  await login(DEMO_PARENT.email, DEMO_PARENT.password, "PARENT");
  await logout();

  console.log("10. 교사 재로그인 → 반/원아 유지 확인");
  await login(TEACHER.email, TEACHER.password, "TEACHER");
  teacherData = await api("/api/data");
  assert(teacherData.ok, `교사 data 조회 실패`);
  assert(
    hasClassAndChild(teacherData.json, classId, className, childId, childName),
    `학부모 로그인/로그아웃 후 교사 반/원아 사라짐`,
  );
  console.log("   ✓ 학부모 활동 후에도 교사 반/원아 유지");

  console.log("\n✅ 전체 테스트 통과");
}

main().catch((err) => {
  console.error("\n❌ 테스트 실패:", err.message);
  process.exit(1);
});
