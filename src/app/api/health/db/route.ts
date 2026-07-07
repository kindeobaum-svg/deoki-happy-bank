import { NextResponse } from "next/server";
import { getDatabaseMode, prisma } from "@/lib/db";
import { bootstrapTursoIfNeeded } from "@/lib/bootstrapTurso";
import { ensureClassRoomSchema } from "@/lib/ensureClassRoomSchema";
import { getTursoConfig } from "@/lib/tursoConfig";

function getAuthSource(): "TURSO_*" | "DATABASE_URL" | "none" {
  const directUrl = (process.env.TURSO_DATABASE_URL ?? "").trim();
  const directToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (directUrl.startsWith("libsql:") && directToken) return "TURSO_*";

  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (databaseUrl.startsWith("libsql:") && databaseUrl.includes("authToken=")) return "DATABASE_URL";

  return "none";
}

/** 운영 DB 연결 상태 확인 (비밀값 미노출) */
export async function GET() {
  const mode = getDatabaseMode();
  const turso = getTursoConfig();
  const authSource = getAuthSource();

  try {
    await bootstrapTursoIfNeeded();
    if (mode !== "turso") {
      await ensureClassRoomSchema();
    }

    const [classRoomCount, childCount, inviteCount] = await Promise.all([
      prisma.classRoom.count(),
      prisma.child.count(),
      prisma.inviteCode.count(),
    ]);

    return NextResponse.json({
      ok: true,
      mode,
      tursoConfigured: turso !== null,
      tursoHost: turso ? new URL(turso.url).host : null,
      authSource,
      counts: {
        classRoom: classRoomCount,
        child: childCount,
        inviteCode: inviteCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DB query failed";
    const hint =
      message.includes("400") || message.includes("401")
        ? "TURSO_AUTH_TOKEN을 Turso 대시보드에서 재발급 후 Vercel env 업데이트 + Redeploy 필요"
        : undefined;

    return NextResponse.json(
      {
        ok: false,
        mode,
        tursoConfigured: turso !== null,
        tursoHost: turso ? new URL(turso.url).host : null,
        authSource,
        tokenConfigured: Boolean(turso?.authToken),
        error: message,
        hint,
      },
      { status: 503 },
    );
  }
}
