import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickChildAvatar } from "@/lib/childAvatars";

function canManageChildren(role: Role) {
  return role === "TEACHER";
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || !canManageChildren(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const data: { name?: string; className?: string; avatar?: string } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
    }
    data.name = name;
  }

  if (body.className !== undefined) {
    const className = String(body.className).trim();
    if (!className) {
      return NextResponse.json({ error: "반을 선택해 주세요." }, { status: 400 });
    }
    data.className = className;
  }

  if (body.avatar !== undefined) {
    const avatar = String(body.avatar).trim();
    data.avatar = avatar.startsWith("data:image/")
      ? avatar
      : avatar || pickChildAvatar(String(data.name ?? id));
  }

  const child = await prisma.child.update({
    where: { id },
    data,
  });

  return NextResponse.json({ child });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || !canManageChildren(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await context.params;
  await prisma.child.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
