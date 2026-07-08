import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { ensureDatabaseReady } from "@/lib/bootstrapTurso";
import { createClassRoom, listClassRooms } from "@/lib/classService";
import { prisma } from "@/lib/db";

function canManageClasses(role: Role) {
  return role === "TEACHER" || role === "DIRECTOR";
}

export async function GET() {
  const session = await getSession();
  if (!session || !canManageClasses(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await ensureDatabaseReady();
  const classes = await listClassRooms(prisma);
  return NextResponse.json({ classes });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !canManageClasses(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();

  try {
    await ensureDatabaseReady();
    const classRoom = await createClassRoom(prisma, name);
    return NextResponse.json({ class: classRoom });
  } catch (error) {
    const message = error instanceof Error ? error.message : "반 추가에 실패했습니다.";
    const status = message.includes("입력") ? 400 : message.includes("이미") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
