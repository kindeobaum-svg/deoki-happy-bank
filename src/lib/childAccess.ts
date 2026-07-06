import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";

export function canAccessChild(role: Role, userChildId: string | null, childId: string) {
  if (role === "DIRECTOR" || role === "TEACHER") return true;
  return userChildId === childId;
}

export async function requireChildAccess(childId: string) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  }
  if (!canAccessChild(session.role, session.childId, childId)) {
    return { error: NextResponse.json({ error: "권한이 없습니다." }, { status: 403 }) };
  }
  return { session };
}
