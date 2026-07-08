/** 서버 startup 시 Turso JWT 해석 — Vercel 연동 env가 비표준 형식이어도 연결 준비 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { isTursoEnvDeclared, ensureTursoConfigResolved } = await import("@/lib/tursoConfig");
  if (!isTursoEnvDeclared()) return;

  try {
    await ensureTursoConfigResolved();
  } catch (error) {
    console.warn("[instrumentation] Turso config resolve skipped:", error);
  }
}
