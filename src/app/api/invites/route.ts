import { NextResponse } from "next/server";
import type { InviteTargetRole } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureDbReady } from "@/lib/ensureDbReady";
import { findChildRecord } from "@/lib/childLookup";
import {
  canCreateInvite,
  ChildNotFoundError,
  createParentInviteForChild,
  formatInviteCode,
  generateUniqueTeacherInviteCode,
} from "@/lib/inviteCode";

async function resolveInviteCreatorId(sessionId: string, sessionEmail: string) {
  const byId = await prisma.user.findUnique({ where: { id: sessionId }, select: { id: true } });
  if (byId) return byId.id;

  const byEmail = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true },
  });
  return byEmail?.id ?? null;
}

export async function POST(request: Request) {
  await ensureDbReady();
  const session = await getSession();
  if (!session || (session.role !== "TEACHER" && session.role !== "DIRECTOR")) {
    return NextResponse.json({ error: "초대코드를 만들 권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const targetRole = String(body.targetRole ?? "").toUpperCase() as InviteTargetRole;
  const childId = body.childId ? String(body.childId) : null;
  const accountNumber = body.accountNumber ? String(body.accountNumber) : null;
  const childName = body.childName ? String(body.childName) : null;
  const className = body.className ? String(body.className) : null;

  if (targetRole !== "PARENT" && targetRole !== "TEACHER") {
    return NextResponse.json({ error: "올바른 초대 유형이 아닙니다." }, { status: 400 });
  }

  if (!canCreateInvite(session.role, targetRole)) {
    return NextResponse.json({ error: "이 초대 유형을 만들 권한이 없습니다." }, { status: 403 });
  }

  const creatorId = await resolveInviteCreatorId(session.id, session.email);
  if (!creatorId) {
    return NextResponse.json(
      { error: "세션이 만료되었습니다. 다시 로그인해 주세요." },
      { status: 401 },
    );
  }

  let invite;

  if (targetRole === "PARENT") {
    if (!childId && !accountNumber && !(childName && className)) {
      return NextResponse.json({ error: "학부모 초대에는 원아가 필요합니다." }, { status: 400 });
    }

    const child = await findChildRecord(prisma, {
      childId,
      accountNumber,
      name: childName,
      className,
    });

    if (!child) {
      return NextResponse.json({ error: "원아를 찾을 수 없습니다." }, { status: 404 });
    }

    try {
      invite = await createParentInviteForChild(
        prisma,
        {
          childId: child.id,
          accountNumber: child.accountNumber,
          name: child.name,
          className: child.className,
        },
        creatorId,
      );
    } catch (error) {
      if (error instanceof ChildNotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      console.error("POST /api/invites parent invite failed:", error);
      return NextResponse.json(
        { error: "초대코드를 만들지 못했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 500 },
      );
    }
  } else {
    const code = await generateUniqueTeacherInviteCode(prisma);
    invite = await prisma.inviteCode.create({
      data: {
        code,
        targetRole: "TEACHER",
        createdById: creatorId,
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
      storage: "InviteCode + Child.accountNumber",
    },
  });
}
