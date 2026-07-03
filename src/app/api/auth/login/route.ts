import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { COOKIE_NAME, createSessionToken, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const expectedRole = body.expectedRole as Role | undefined;

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  if (expectedRole && user.role !== expectedRole) {
    const roleNames: Record<Role, string> = {
      PARENT: "학부모",
      TEACHER: "교사",
      CHILD: "원아",
      DIRECTOR: "원장",
    };
    return NextResponse.json(
      { error: `${roleNames[expectedRole]} 계정으로 로그인해 주세요.` },
      { status: 403 },
    );
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    childId: user.childId,
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      childId: user.childId,
    },
  });

  response.cookies.set(COOKIE_NAME, token, sessionCookieOptions());

  return response;
}
