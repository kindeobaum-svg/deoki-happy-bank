import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyAllParents } from "@/lib/push";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "DIRECTOR")) {
    return NextResponse.json({ error: "교사 또는 원장만 등록할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();
  const author = String(body.author ?? session.name).trim();

  if (!title || !content) {
    return NextResponse.json({ error: "제목과 내용을 입력해 주세요." }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: { title, content, author },
  });

  await notifyAllParents({
    title: "📢 새 공지사항",
    body: title,
    url: "/parent",
  });

  return NextResponse.json({ announcement });
}
