import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildPassbookEntries } from "@/lib/passbook";

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

  const records = await prisma.saveRecord.findMany({
    where: { childId: id },
    orderBy: { createdAt: "asc" },
  });

  const entries = buildPassbookEntries(
    records.map((r) => ({
      id: r.id,
      childId: r.childId,
      amount: r.amount,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    })),
  );

  return NextResponse.json({ child, entries });
}

function canAccessChild(role: Role, userChildId: string | null, childId: string) {
  if (role === "DIRECTOR" || role === "TEACHER") return true;
  return userChildId === childId;
}
