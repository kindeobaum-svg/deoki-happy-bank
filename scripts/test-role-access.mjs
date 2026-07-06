/**
 * 역할별 라우트 접근 테스트
 * node scripts/test-role-access.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";

const ACCOUNTS = {
  PARENT: { email: "parent@haengbok.local", password: "1234", expectedRole: "PARENT", home: "/parent" },
  TEACHER: { email: "teacher@haengbok.local", password: "1234", expectedRole: "TEACHER", home: "/teacher" },
  DIRECTOR: { email: "director@haengbok.local", password: "1234", expectedRole: "DIRECTOR", home: "/admin" },
};

let cookie = "";

function parseSetCookie(h) {
  return h ? h.split(";")[0] : "";
}

async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { ...options, headers, redirect: "manual" });
  const sc = res.headers.get("set-cookie");
  if (sc) cookie = parseSetCookie(sc);
  return {
    status: res.status,
    location: res.headers.get("location"),
    json: await res.json().catch(() => ({})),
  };
}

function assert(c, m) {
  if (!c) throw new Error(m);
}

async function loginAs(roleKey) {
  const account = ACCOUNTS[roleKey];
  cookie = "";
  const res = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: account.email,
      password: account.password,
      expectedRole: account.expectedRole,
    }),
  });
  assert(res.status === 200, `${roleKey} 로그인 실패`);
}

function expectRedirectToHome(res, roleKey) {
  const home = ACCOUNTS[roleKey].home;
  assert(
    res.status >= 300 && res.status < 400,
    `${roleKey} 접근 시 리다이렉트가 아님: ${res.status}`,
  );
  assert(
    res.location?.includes(home),
    `기대 홈 ${home}, 실제 ${res.location}`,
  );
}

async function main() {
  console.log("1. 학부모 → /teacher 차단 → /parent");
  await loginAs("PARENT");
  expectRedirectToHome(await api("/teacher"), "PARENT");

  console.log("2. 학부모 → /admin 차단 → /parent");
  expectRedirectToHome(await api("/admin"), "PARENT");

  console.log("3. 교사 → /parent 차단 → /teacher");
  await loginAs("TEACHER");
  expectRedirectToHome(await api("/parent"), "TEACHER");

  console.log("4. 교사 → /admin 차단 → /teacher");
  expectRedirectToHome(await api("/admin"), "TEACHER");

  console.log("5. 원장 → /teacher 차단 → /admin");
  await loginAs("DIRECTOR");
  expectRedirectToHome(await api("/teacher"), "DIRECTOR");

  console.log("6. 학부모 → 교사 API 차단");
  await loginAs("PARENT");
  const classes = await api("/api/classes");
  assert(classes.status === 403, "학부모가 /api/classes 접근 가능");

  console.log("7. 교사 → 학부모 API 경로 차단 (페이지)");
  await loginAs("TEACHER");
  expectRedirectToHome(await api("/passbook"), "TEACHER");

  console.log("8. 로그인 후 / → 역할 홈");
  await loginAs("PARENT");
  expectRedirectToHome(await api("/"), "PARENT");

  console.log("\n✅ 역할별 접근 제한 테스트 통과");
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
