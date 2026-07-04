import type { Child, PrismaClient } from "@prisma/client";
import { compactInviteCode, normalizeInviteCodeInput } from "@/lib/inviteCodeUtils";

export type ChildLookupInput = {
  childId?: string | null;
  accountNumber?: string | null;
  name?: string | null;
  className?: string | null;
};

function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * 학부모 초대·API 공통 — children 테이블에서 동일 레코드 조회
 * 1) Child.id (cuid)
 * 2) Child.accountNumber (정규화·완화 비교)
 * 3) name + className (교사가 방금 등록한 원아 대비)
 */
export async function findChildRecord(
  prisma: PrismaClient,
  input: ChildLookupInput,
): Promise<Child | null> {
  const childId = clean(input.childId);
  const accountNumber = clean(input.accountNumber);
  const name = clean(input.name);
  const className = clean(input.className);

  if (childId) {
    const byId = await prisma.child.findUnique({ where: { id: childId } });
    if (byId) return byId;
  }

  if (accountNumber) {
    const normalized = normalizeInviteCodeInput(accountNumber);
    const byAccount = await prisma.child.findFirst({
      where: {
        OR: [{ accountNumber }, { accountNumber: normalized }],
      },
    });
    if (byAccount) return byAccount;

    const compact = compactInviteCode(accountNumber);
    if (compact) {
      const children = await prisma.child.findMany();
      const matched = children.find((child) => compactInviteCode(child.accountNumber) === compact);
      if (matched) return matched;
    }
  }

  if (name && className) {
    const byName = await prisma.child.findFirst({
      where: { name, className },
      orderBy: { id: "desc" },
    });
    if (byName) return byName;
  }

  return null;
}

export class ChildNotFoundError extends Error {
  constructor(message = "원아를 찾을 수 없습니다.") {
    super(message);
    this.name = "ChildNotFoundError";
  }
}

export async function requireChildRecord(
  prisma: PrismaClient,
  input: ChildLookupInput,
): Promise<Child> {
  const child = await findChildRecord(prisma, input);
  if (!child) throw new ChildNotFoundError();
  return child;
}
