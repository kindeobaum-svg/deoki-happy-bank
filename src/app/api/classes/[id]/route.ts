import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { deleteClassRoom, updateClassRoom } from "@/lib/classService";
import { prisma } from "@/lib/db";

function canManageClasses(role: Role) {
  return role === "TEACHER";
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || !canManageClasses(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const name = String(body.name ?? "").trim();

  try {
    const classRoom = await updateClassRoom(prisma, id, name);
    return NextResponse.json({ class: classRoom });
  } catch (error) {
    const message = error instanceof Error ? error.message : "반 수정에 실패했습니다.";
    const status = message.includes("찾을") ? 404 : message.includes("이미") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || !canManageClasses(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    await deleteClassRoom(prisma, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "반 삭제에 실패했습니다.";
    const status = message.includes("찾을") ? 404 : message.includes("원아") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
