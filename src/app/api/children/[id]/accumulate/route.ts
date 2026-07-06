import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SAVE_AMOUNT } from "@/lib/tree";
import { notifyParentsOfChild } from "@/lib/push";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const message = String(body.message ?? "오늘도 잘했어요!");

  const child = await prisma.child.findUnique({ where: { id } });
  if (!child) {
    return NextResponse.json({ error: "원아를 찾을 수 없습니다." }, { status: 404 });
  }

  if (session.role === "CHILD" && session.childId !== id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const [updated, record] = await prisma.$transaction([
    prisma.child.update({
      where: { id },
      data: {
        points: { increment: 1 },
        totalSaved: { increment: SAVE_AMOUNT },
      },
    }),
    prisma.saveRecord.create({
      data: { childId: id, amount: SAVE_AMOUNT, message, type: "DEPOSIT" },
    }),
  ]);

  await notifyParentsOfChild(id, {
    title: "🌳 행복 적립!",
    body: `${child.name}님이 "${message}" — ${SAVE_AMOUNT}원 적립`,
    url: "/parent/diary",
  });

  return NextResponse.json({ child: updated, record });
}
