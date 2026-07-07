/**
 * 운영 7단계 E2E 검증
 * node scripts/test-e2e-production.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "https://deoki-happy-bank.vercel.app";
const TEACHER = { email: "teacher@haengbok.local", password: "1234", expectedRole: "TEACHER" };

let cookie = "";
const suffix = Date.now();
const className = `E2E반-${suffix}`;
const childName = `E2E원아-${suffix}`;
const parentEmail = `e2e-${suffix}@test.local`;
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
    json = { _raw: text.slice(0, 300) };
  }
  return { ok: res.ok, status: res.status, json };
}

function step(n, label, pass, detail = "") {
  const mark = pass ? "✅" : "❌";
  console.log(`${mark} ${n}. ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) throw new Error(`Step ${n} failed: ${label}`);
}

async function main() {
  console.log(`=== 운영 7단계 E2E: ${BASE} ===\n`);

  const health = await api("/api/health/db");
  step(
    1,
    "/api/health/db (mode:turso, tursoConfigured:true)",
    health.ok && health.json.mode === "turso" && health.json.tursoConfigured === true,
    JSON.stringify({ ok: health.json.ok, mode: health.json.mode, tursoConfigured: health.json.tursoConfigured }),
  );

  cookie = "";
  step(2, "교사 로그인", (await api("/api/auth/login", { method: "POST", body: JSON.stringify(TEACHER) })).ok);

  const cls = await api("/api/classes", { method: "POST", body: JSON.stringify({ name: className }) });
  step(3, "원아 추가 (반 생성 포함)", cls.ok, className);

  const child = await api("/api/children", {
    method: "POST",
    body: JSON.stringify({ name: childName, className }),
  });
  step(3, "원아 추가", child.ok, childName);
  const childId = child.json.child?.id ?? "";
  const accountNumber = child.json.child?.accountNumber ?? "";

  const inv = await api("/api/invites", {
    method: "POST",
    body: JSON.stringify({
      targetRole: "PARENT",
      childId,
      accountNumber,
      childName,
      className,
    }),
  });
  step(4, "학부모 초대코드 생성", inv.ok, inv.json.invite?.code);
  const inviteCode = inv.json.invite?.code ?? "";

  cookie = "";
  const verify = await api("/api/invites/verify", {
    method: "POST",
    body: JSON.stringify({ code: inviteCode }),
  });
  step(5, "학부모 초대코드 검증", verify.ok && verify.json.valid === true, verify.json.child?.name);

  const join = await api("/api/invites/redeem", {
    method: "POST",
    body: JSON.stringify({
      code: inviteCode,
      email: parentEmail,
      password: parentPassword,
      name: "E2E학부모",
    }),
  });
  step(6, "학부모 회원가입", join.ok && join.json.user?.childId === childId);

  cookie = "";
  await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: parentEmail, password: parentPassword, expectedRole: "PARENT" }),
  });
  const phome = await api("/api/auth/parent-home");
  const data = await api("/api/data");
  const linkedChild = data.json.children?.[0];
  step(
    7,
    "학부모 화면 원아 정보 확인",
    phome.ok &&
      phome.json.parentSession?.childId === childId &&
      linkedChild?.id === childId &&
      linkedChild?.name === childName,
    linkedChild?.name,
  );

  console.log("\n✅ 운영 7단계 E2E 전체 통과");
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
