import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  childId: string | null;
};

const COOKIE_NAME = "haengbok-session";

/** .env.example 과 동일 — Vercel에 AUTH_SECRET 미설정 시에도 데모 세션 서명에 사용 */
const DEFAULT_AUTH_SECRET = "change-me-in-production-use-long-random-string";

function getSecret() {
  const secret = process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    childId: user.childId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

/** 브라우저를 닫으면 만료되는 세션 쿠키 (maxAge 없음) */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function clearSessionCookieOptions() {
  return {
    ...sessionCookieOptions(),
    maxAge: 0,
  };
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
      childId: (payload.childId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export { COOKIE_NAME };
