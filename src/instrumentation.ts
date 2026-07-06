export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.VERCEL) return;
  const { getDatabaseMode } = await import("@/lib/db");
  if (getDatabaseMode() === "turso") return;

  const { warmDemoDatabase } = await import("@/lib/demoDb");
  warmDemoDatabase();
}
