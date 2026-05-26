import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickChildAvatar } from "@/lib/childAvatars";

function canManageChildren(role: Role) {
  return role === "TEACHER" || role === "DIRECTOR";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !canManageChildren(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const className = String(body.className ?? "").trim();
  const avatar = String(body.avatar ?? "").trim() || pickChildAvatar(name);

  if (!name || !className) {
    return NextResponse.json({ error: "원아 이름과 반을 입력해 주세요." }, { status: 400 });
  }

  const accountNumber = `HB-${Date.now().toString(36).toUpperCase()}`;

  const child = await prisma.child.create({
    data: {
      name,
      className,
      accountNumber,
      avatar,
      points: 0,
      totalSaved: 0,
    },
  });

  return NextResponse.json({ child });
}
