import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureDatabaseReady } from "@/lib/ensureDatabaseReady";
import { loadParentSessionFromDb } from "@/lib/parentSession";

/** 학부모 DB 연결(parent user id ↔ child id) 조회 — 초대코드 검증 없음 */
export async function GET() {
  await ensureDatabaseReady();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ linked: false, user: null });
  }

  if (session.role !== "PARENT") {
    return NextResponse.json({ linked: false, user: session });
  }

  const parentSession = await loadParentSessionFromDb(session.id);
  if (!parentSession) {
    return NextResponse.json({
      linked: false,
      user: session,
      error: "연결된 원아 정보가 없습니다.",
    });
  }

  return NextResponse.json({
    linked: true,
    user: session,
    parentSession,
    homePath: parentSession.homePath,
  });
}
