import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PARENT_HOME_PATH } from "@/lib/parentHomePath";

export type ParentSessionInfo = {
  userId: string;
  childId: string;
  childName: string;
  homePath: string;
};

/** DB User.childId 기준 학부모 홈 경로 — 초대코드와 무관 */
export function getParentHomePath(childId: string | null | undefined): string | null {
  if (!childId) return null;
  return PARENT_HOME_PATH;
}

export async function loadParentSessionFromDb(
  userId: string,
): Promise<ParentSessionInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      childId: true,
      child: { select: { id: true, name: true } },
    },
  });

  if (!user || user.role !== "PARENT" || !user.childId || !user.child) {
    return null;
  }

  return {
    userId: user.id,
    childId: user.childId,
    childName: user.child.name,
    homePath: PARENT_HOME_PATH,
  };
}

export function getHomeForSession(role: Role, childId: string | null): string {
  if (role === "PARENT") {
    return getParentHomePath(childId) ?? "/login/parent";
  }

  const homes: Record<Role, string> = {
    DIRECTOR: "/admin",
    TEACHER: "/teacher",
    PARENT: PARENT_HOME_PATH,
    CHILD: "/child",
  };
  return homes[role] ?? "/";
}
