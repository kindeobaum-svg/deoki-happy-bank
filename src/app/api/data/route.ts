import { NextResponse } from "next/server";
import type { Child } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { listClassRooms } from "@/lib/classService";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/attendance";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let children: Child[] = [];
  let classes: { id: string; name: string }[] = [];
  let linkedChildId: string | null = session.childId;

  if (session.role === "PARENT") {
    const parentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { childId: true },
    });
    linkedChildId = parentUser?.childId ?? null;
  }

  if (session.role === "TEACHER" || session.role === "DIRECTOR") {
    [children, classes] = await Promise.all([
      prisma.child.findMany({ orderBy: { name: "asc" } }),
      listClassRooms(prisma),
    ]);
  } else if (linkedChildId) {
    children = await prisma.child.findMany({ where: { id: linkedChildId } });
  }

  const childIds = children.map((c) => c.id);
  const today = todayStr();

  const [
    passbookTransactions,
    missionCompletions,
    diaryDeposits,
    announcements,
    dailyReports,
    attendances,
    praiseRecords,
  ] = await Promise.all([
    prisma.passbookTransaction.findMany({
      where: { childId: { in: childIds } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.missionCompletion.findMany({
      where: { childId: { in: childIds }, date: today },
    }),
    prisma.diaryDeposit.findMany({
      where: { childId: { in: childIds } },
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
    classes,
    children,
    passbookTransactions: passbookTransactions.map((t) => ({
      id: t.id,
      childId: t.childId,
      type: t.type === "DEPOSIT" ? "deposit" : "withdrawal",
      item: t.item,
      amount: t.amount,
      balance: t.balance,
      date: t.date,
      createdAt: t.createdAt.toISOString(),
    })),
    missionCompletions: missionCompletions.map((m) => ({
      id: m.id,
      childId: m.childId,
      missionId: m.missionId,
      date: m.date,
    })),
    diaryDeposits: diaryDeposits.map((d) => ({
      id: d.id,
      childId: d.childId,
      reportDate: d.reportDate,
    })),
    announcements,
    dailyReports,
    attendances,
    praiseRecords,
    selectedChildId: linkedChildId ?? children[0]?.id ?? null,
  });
}
