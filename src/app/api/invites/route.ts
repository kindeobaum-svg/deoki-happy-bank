import { NextResponse } from "next/server";
import type { InviteTargetRole } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createParentInviteForChild,
  formatInviteCode,
  generateUniqueTeacherInviteCode,
} from "@/lib/inviteCode";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "초대코드를 만들 권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const targetRole = String(body.targetRole ?? "").toUpperCase() as InviteTargetRole;
  const childId = body.childId ? String(body.childId) : null;

  if (targetRole !== "PARENT" && targetRole !== "TEACHER") {
    return NextResponse.json({ error: "올바른 초대 유형이 아닙니다." }, { status: 400 });
  }

  if (targetRole === "PARENT" && session.role !== "TEACHER") {
    return NextResponse.json({ error: "학부모 초대는 교사만 만들 수 있습니다." }, { status: 403 });
  }

  if (targetRole === "TEACHER" && session.role !== "DIRECTOR") {
    return NextResponse.json({ error: "교사 초대는 원장만 만들 수 있습니다." }, { status: 403 });
  }

  let invite;

  if (targetRole === "PARENT") {
    if (!childId) {
      return NextResponse.json({ error: "학부모 초대에는 원아가 필요합니다." }, { status: 400 });
    }
    try {
      invite = await createParentInviteForChild(prisma, childId, session.id);
    } catch {
      return NextResponse.json({ error: "원아를 찾을 수 없습니다." }, { status: 404 });
    }
  } else {
    const code = await generateUniqueTeacherInviteCode(prisma);
    invite = await prisma.inviteCode.create({
      data: {
        code,
        targetRole: "TEACHER",
        createdById: session.id,
      },
      include: {
        child: { select: { id: true, name: true, className: true } },
      },
    });
  }

  return NextResponse.json({
    invite: {
      id: invite.id,
      code: invite.code,
      formattedCode: formatInviteCode(invite.code),
      targetRole: invite.targetRole,
      child: invite.child,
      createdAt: invite.createdAt.toISOString(),
      storage: "sqlite:InviteCode + Child.accountNumber",
    },
  });
}
