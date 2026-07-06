import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyParentsOfChild } from "@/lib/push";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "교사 또는 원장만 작성할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json();
  const childId = String(body.childId ?? "");
  const mood = String(body.mood ?? "😊");
  const meal = String(body.meal ?? "");
  const nap = String(body.nap ?? "");
  const note = String(body.note ?? "").trim();
  const date = new Date().toISOString().slice(0, 10);

  if (!childId || !note) {
    return NextResponse.json({ error: "원아와 내용을 입력해 주세요." }, { status: 400 });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return NextResponse.json({ error: "원아를 찾을 수 없습니다." }, { status: 404 });
  }

  const report = await prisma.dailyReport.upsert({
    where: { childId_date: { childId, date } },
    create: { childId, date, mood, meal, nap, note },
    update: { mood, meal, nap, note },
  });

  await notifyParentsOfChild(childId, {
    title: "📝 알림장 도착",
    body: `${child.name}님의 오늘 알림장이 등록되었어요.`,
    url: "/parent/diary",
  });

  return NextResponse.json({ report });
}
