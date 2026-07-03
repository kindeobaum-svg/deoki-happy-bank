export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.VERCEL) return;
  const { warmDemoDatabase } = await import("@/lib/demoDb");
  warmDemoDatabase();
}
