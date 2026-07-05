import { NextResponse } from "next/server";
import type { AttendanceStatus } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyParentsOfChild } from "@/lib/push";
import { ATTENDANCE_LABELS } from "@/lib/attendance";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  let childIds: string[] = [];
  if (session.role === "TEACHER" || session.role === "DIRECTOR") {
    const all = await prisma.child.findMany({ select: { id: true } });
    childIds = all.map((c) => c.id);
  } else if (session.childId) {
    childIds = [session.childId];
  }

  const attendances = await prisma.attendance.findMany({
    where: { date, childId: { in: childIds } },
  });

  return NextResponse.json({ attendances, date });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "DIRECTOR")) {
    return NextResponse.json({ error: "교사 또는 원장만 기록할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json();
  const childId = String(body.childId ?? "");
  const status = String(body.status ?? "PRESENT") as AttendanceStatus;
  const date = String(body.date ?? new Date().toISOString().slice(0, 10));

  if (!childId || !["PRESENT", "LATE", "ABSENT"].includes(status)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return NextResponse.json({ error: "원아를 찾을 수 없습니다." }, { status: 404 });
  }

  const attendance = await prisma.attendance.upsert({
    where: { childId_date: { childId, date } },
    create: { childId, date, status },
    update: { status },
  });

  if (status === "LATE" || status === "ABSENT") {
    await notifyParentsOfChild(childId, {
      title: `${ATTENDANCE_LABELS[status]} 알림`,
      body: `${child.name}님 오늘 ${ATTENDANCE_LABELS[status]} 처리되었습니다.`,
      url: "/parent",
    });
  } else {
    await notifyParentsOfChild(childId, {
      title: "✅ 출석 완료",
      body: `${child.name}님이 어린이집에 도착했어요!`,
      url: "/parent",
    });
  }

  return NextResponse.json({ attendance });
}
