import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyParentsOfChild } from "@/lib/push";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "교사 또는 원장만 기록할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json();
  const childId = String(body.childId ?? "");
  const message = String(body.message ?? "").trim();
  const emoji = String(body.emoji ?? "⭐");
  const date = new Date().toISOString().slice(0, 10);

  if (!childId || !message) {
    return NextResponse.json({ error: "원아와 칭찬 내용을 입력해 주세요." }, { status: 400 });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return NextResponse.json({ error: "원아를 찾을 수 없습니다." }, { status: 404 });
  }

  const praise = await prisma.praiseRecord.create({
    data: {
      childId,
      message,
      emoji,
      author: session.name,
      date,
    },
  });

  await notifyParentsOfChild(childId, {
    title: `${emoji} 오늘의 칭찬`,
    body: `${child.name}님 — ${message}`,
    url: "/parent/diary",
  });

  return NextResponse.json({ praise });
}
