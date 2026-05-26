import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "DIRECTOR") {
    return NextResponse.json({ error: "원장만 접근할 수 있습니다." }, { status: 403 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = new Date(today);

  const [children, parentCount, teacherCount, recentSaves, todaySaves] = await Promise.all([
    prisma.child.findMany({ orderBy: { name: "asc" } }),
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.saveRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { child: { select: { name: true, avatar: true } } },
    }),
    prisma.saveRecord.count({
      where: { createdAt: { gte: todayStart } },
    }),
  ]);

  const totalSaved = children.reduce((sum, c) => sum + c.totalSaved, 0);
  const totalPoints = children.reduce((sum, c) => sum + c.points, 0);

  return NextResponse.json({
    totalChildren: children.length,
    totalSaved,
    totalPoints,
    todaySaves,
    parentCount,
    teacherCount,
    children,
    recentSaves: recentSaves.map((s) => ({
      id: s.id,
      message: s.message,
      amount: s.amount,
      createdAt: s.createdAt.toISOString(),
      childName: s.child.name,
      childAvatar: s.child.avatar,
    })),
  });
}
