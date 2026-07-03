import type { PrismaClient } from "@prisma/client";

const CHILD_CODE_PREFIX = "DK-CHILD-";

/** 원아 학부모 초대코드: DK-CHILD-000001 형식 (SQLite DB Child.accountNumber) */
export async function generateUniqueChildInviteCode(prisma: PrismaClient): Promise<string> {
  const children = await prisma.child.findMany({
    where: { accountNumber: { startsWith: CHILD_CODE_PREFIX } },
    select: { accountNumber: true },
  });

  let maxSeq = 0;
  for (const child of children) {
    const match = child.accountNumber.match(/DK-CHILD-(\d+)$/i);
    if (match) {
      maxSeq = Math.max(maxSeq, Number.parseInt(match[1]!, 10));
    }
  }

  for (let seq = maxSeq + 1; seq < maxSeq + 1000; seq++) {
    const code = `${CHILD_CODE_PREFIX}${String(seq).padStart(6, "0")}`;
    const existing = await prisma.child.findUnique({ where: { accountNumber: code } });
    if (!existing) return code;
  }

  throw new Error("고유한 원아 초대코드를 생성하지 못했습니다.");
}

export { CHILD_CODE_PREFIX };
