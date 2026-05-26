import { NextResponse } from "next/server";
import type { Child } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let children: Child[] = [];
  if (session.role === "TEACHER" || session.role === "DIRECTOR") {
    children = await prisma.child.findMany({ orderBy: { name: "asc" } });
  } else if (session.childId) {
    children = await prisma.child.findMany({ where: { id: session.childId } });
  }

  const childIds = children.map((c) => c.id);
  const today = new Date().toISOString().slice(0, 10);

  const [saveRecords, announcements, dailyReports, attendances, praiseRecords] =
    await Promise.all([
      prisma.saveRecord.findMany({
        where: { childId: { in: childIds } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.dailyReport.findMany({
        where: { childId: { in: childIds } },
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.attendance.findMany({
        where: { childId: { in: childIds }, date: today },
      }),
      prisma.praiseRecord.findMany({
        where: { childId: { in: childIds } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

  return NextResponse.json({
    user: session,
    children,
    saveRecords,
    announcements,
    dailyReports,
    attendances,
    praiseRecords,
    selectedChildId: session.childId ?? children[0]?.id ?? null,
  });
}
