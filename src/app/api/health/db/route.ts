import { NextResponse } from "next/server";
import { getDatabaseMode, prisma } from "@/lib/db";
import { ensureClassRoomSchema } from "@/lib/ensureClassRoomSchema";
import { getTursoConfig } from "@/lib/tursoConfig";

/** 운영 DB 연결 상태 확인 (비밀값 미노출) */
export async function GET() {
  const mode = getDatabaseMode();
  const turso = getTursoConfig();

  let classRoomCount = 0;
  let childCount = 0;
  let inviteCount = 0;

  try {
    await ensureClassRoomSchema();
    [classRoomCount, childCount, inviteCount] = await Promise.all([
      prisma.classRoom.count(),
      prisma.child.count(),
      prisma.inviteCode.count(),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "DB query failed";
    return NextResponse.json(
      {
        ok: false,
        mode,
        tursoConfigured: turso !== null,
        tursoHost: turso ? new URL(turso.url).host : null,
        error: message,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    mode,
    tursoConfigured: turso !== null,
    tursoHost: turso ? new URL(turso.url).host : null,
    counts: {
      classRoom: classRoomCount,
      child: childCount,
      inviteCode: inviteCount,
    },
  });
}
