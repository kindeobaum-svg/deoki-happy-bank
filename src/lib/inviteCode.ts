import { randomBytes } from "crypto";
import type { InviteCode, PrismaClient } from "@prisma/client";
import {
  canCreateInvite,
  formatInviteCode,
  inviteCodesMatch,
  normalizeInviteCodeInput,
} from "@/lib/inviteCodeUtils";
import { ChildNotFoundError, requireChildRecord, type ChildLookupInput } from "@/lib/childLookup";

export {
  canCreateInvite,
  formatInviteCode,
  normalizeInviteCodeInput,
  compactInviteCode,
  inviteCodesMatch,
} from "@/lib/inviteCodeUtils";

const CODE_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 12;

const childInclude = {
  child: { select: { id: true, name: true, className: true } },
} as const;

function randomTeacherInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}

/** 교사 초대용 랜덤 코드 (InviteCode 테이블) */
export async function generateUniqueTeacherInviteCode(prisma: PrismaClient): Promise<string> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = randomTeacherInviteCode();
    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("고유한 초대코드를 생성하지 못했습니다.");
}

export type InviteValidationResult =
  | { valid: true; invite: InviteCode & { child?: { id: string; name: string; className: string } | null } }
  | { valid: false; error: string };

async function findUnusedInviteByStoredCode(
  prisma: PrismaClient,
  storedCode: string,
) {
  const normalized = normalizeInviteCodeInput(storedCode);

  const direct = await prisma.inviteCode.findFirst({
    where: {
      usedAt: null,
      OR: [{ code: normalized }, { code: storedCode.trim() }],
    },
    include: childInclude,
  });
  if (direct) return direct;

  const unusedInvites = await prisma.inviteCode.findMany({
    where: { usedAt: null },
    include: childInclude,
  });

  return unusedInvites.find((invite) => inviteCodesMatch(invite.code, normalized)) ?? null;
}

/**
 * 학부모 초대코드 검증 — InviteCode 테이블 + Child.accountNumber 동일 DB 조회
 */
export async function findValidInvite(
  prisma: PrismaClient,
  rawCode: string,
): Promise<InviteValidationResult> {
  const normalized = normalizeInviteCodeInput(rawCode);
  if (!normalized) {
    return { valid: false, error: "초대코드를 입력해 주세요." };
  }

  let invite = await findUnusedInviteByStoredCode(prisma, normalized);

  if (!invite) {
    const children = await prisma.child.findMany({
      select: { id: true, name: true, className: true, accountNumber: true },
    });
    const child = children.find((c) => inviteCodesMatch(c.accountNumber, normalized));

    if (child) {
      const usedInvite = await prisma.inviteCode.findFirst({
        where: { childId: child.id, targetRole: "PARENT", usedAt: { not: null } },
        orderBy: { usedAt: "desc" },
        include: childInclude,
      });

      if (usedInvite) {
        return {
          valid: false,
          error:
            "이미 가입이 완료된 초대코드입니다. 로그인 페이지에서 이메일과 비밀번호로 로그인해 주세요.",
        };
      }

      invite = await prisma.inviteCode.findFirst({
        where: { childId: child.id, targetRole: "PARENT", usedAt: null },
        orderBy: { createdAt: "desc" },
        include: childInclude,
      });

      if (!invite) {
        return {
          valid: false,
          error: "유효하지 않은 코드입니다. 교사에게 초대코드를 다시 요청해 주세요.",
        };
      }
    }
  }

  if (!invite) {
    return { valid: false, error: "유효하지 않은 코드입니다." };
  }

  if (invite.usedAt) {
    return {
      valid: false,
      error:
        "이미 사용된 초대코드입니다. 로그인 페이지에서 이메일과 비밀번호로 로그인해 주세요.",
    };
  }

  if (invite.targetRole === "PARENT" && !invite.childId) {
    return { valid: false, error: "유효하지 않은 코드입니다." };
  }

  return { valid: true, invite };
}

/** 학부모 초대코드 생성 — Child.accountNumber와 InviteCode.code 동일 값으로 DB에 저장 */
export async function createParentInviteForChild(
  prisma: PrismaClient,
  lookup: ChildLookupInput,
  createdById: string,
) {
  const child = await requireChildRecord(prisma, lookup);

  const code = normalizeInviteCodeInput(child.accountNumber);

  const existing = await prisma.inviteCode.findFirst({
    where: { childId: child.id, targetRole: "PARENT", usedAt: null, code },
    include: childInclude,
  });
  if (existing) return existing;

  // 가입 완료된(used) 초대코드도 삭제 — 연결은 User.childId에 영구 저장됨
  await prisma.inviteCode.deleteMany({
    where: { childId: child.id, targetRole: "PARENT" },
  });

  return prisma.inviteCode.create({
    data: {
      code,
      targetRole: "PARENT",
      childId: child.id,
      createdById,
    },
    include: childInclude,
  });
}

export { ChildNotFoundError };
