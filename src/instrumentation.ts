export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.VERCEL) return;
  const { warmDemoDatabase } = await import("@/lib/demoDb");
  warmDemoDatabase();
  const { ensureDemoUsers } = await import("@/lib/ensureDemoUsers");
  await ensureDemoUsers().catch((error) => {
    console.error("ensureDemoUsers on startup failed:", error);
  });
}
