import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/ensureDatabaseReady";
import { findValidInvite } from "@/lib/inviteCode";
import { loadParentSessionFromDb } from "@/lib/parentSession";

export async function POST(request: Request) {
  await ensureDatabaseReady();
  const body = await request.json();
  const code = String(body.code ?? "");
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "이름, 이메일, 비밀번호를 모두 입력해 주세요." },
      { status: 400 },
    );
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
  }

  const result = await findValidInvite(prisma, code);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { invite } = result;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const role = invite.targetRole === "TEACHER" ? "TEACHER" : "PARENT";
  const childId = invite.targetRole === "PARENT" ? invite.childId : null;

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        childId,
      },
    });

    await tx.inviteCode.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
        usedById: created.id,
      },
    });

    return created;
  });

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    childId: user.childId,
  });

  const parentSession = await loadParentSessionFromDb(user.id);

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      childId: user.childId,
    },
    parentSession,
    homePath: parentSession?.homePath ?? null,
  });

  response.cookies.set(COOKIE_NAME, token, sessionCookieOptions());

  return response;
}
