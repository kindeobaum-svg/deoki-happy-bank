import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/attendance";
import { MISSIONS } from "@/lib/missions";
import { completeMissionForChild, getTodayCompletedMissionIds } from "@/lib/passbookServer";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const child = await prisma.child.findUnique({ where: { id } });
  if (!child) {
    return NextResponse.json({ error: "원아를 찾을 수 없습니다." }, { status: 404 });
  }

  if (!canAccessChild(session.role, session.childId, id)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const today = todayStr();
  const completedIds = await getTodayCompletedMissionIds(id, today);

  const missions = MISSIONS.map((mission) => ({
    ...mission,
    completed: completedIds.includes(mission.id),
  }));

  return NextResponse.json({ date: today, missions });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const child = await prisma.child.findUnique({ where: { id } });
  if (!child) {
    return NextResponse.json({ error: "원아를 찾을 수 없습니다." }, { status: 404 });
  }

  if (!canAccessChild(session.role, session.childId, id)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const missionId = String(body.missionId ?? "");
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) {
    return NextResponse.json({ error: "미션을 찾을 수 없습니다." }, { status: 404 });
  }

  const today = todayStr();
  const result = await completeMissionForChild(
    id,
    mission.id,
    mission.name,
    mission.amount,
    today,
  );

  if (result.alreadyDone) {
    return NextResponse.json({ alreadyDone: true }, { status: 409 });
  }

  return NextResponse.json({ alreadyDone: false, record: result.record });
}

function canAccessChild(role: Role, userChildId: string | null, childId: string) {
  if (role === "DIRECTOR" || role === "TEACHER") return true;
  return userChildId === childId;
}
