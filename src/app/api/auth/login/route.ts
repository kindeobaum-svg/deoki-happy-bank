import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma, getDatabaseMode } from "@/lib/db";
import { COOKIE_NAME, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { ensureDatabaseReady } from "@/lib/ensureDatabaseReady";
import { loadParentSessionFromDb } from "@/lib/parentSession";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const expectedRole = body.expectedRole as Role | undefined;

    console.log("[auth/login] request", {
      email,
      expectedRole: expectedRole ?? null,
      db: getDatabaseMode(),
    });

    if (!email || !password) {
      return NextResponse.json({ error: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 });
    }

    await ensureDatabaseReady();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      console.warn("[auth/login] rejected", { email, userFound: Boolean(user) });
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

    const parentSession =
      user.role === "PARENT" ? await loadParentSessionFromDb(user.id) : null;

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

    console.log("[auth/login] success", { email, role: user.role });
    return response;
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);
    return NextResponse.json(
      { error: "서버 연결에 문제가 있습니다. 잠시 후 다시 시도해 주세요." },
      { status: 503 },
    );
  }
}
