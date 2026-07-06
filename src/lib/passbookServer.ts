import type { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SaveRecord } from "@/lib/types";

export async function getChildBalance(childId: string): Promise<number> {
  const records = await prisma.saveRecord.findMany({
    where: { childId },
    orderBy: { createdAt: "asc" },
    select: { amount: true, type: true },
  });

  return records.reduce((balance, record) => {
    return record.type === "WITHDRAWAL" ? balance - record.amount : balance + record.amount;
  }, 0);
}

export async function addPassbookTransaction(
  childId: string,
  message: string,
  amount: number,
  type: TransactionType,
) {
  const absAmount = Math.abs(amount);
  const balance = await getChildBalance(childId);

  if (type === "WITHDRAWAL" && balance < absAmount) {
    return { error: "잔액이 부족해요" as const };
  }

  const delta = type === "DEPOSIT" ? absAmount : -absAmount;

  const [record, child] = await prisma.$transaction([
    prisma.saveRecord.create({
      data: { childId, amount: absAmount, message, type },
    }),
    prisma.child.update({
      where: { id: childId },
      data: {
        totalSaved: { increment: delta },
        ...(type === "DEPOSIT" ? { points: { increment: 1 } } : {}),
      },
    }),
  ]);

  return {
    record: {
      id: record.id,
      childId: record.childId,
      amount: record.amount,
      message: record.message,
      type: record.type,
      createdAt: record.createdAt.toISOString(),
    } satisfies SaveRecord,
    child,
  };
}

export async function getTodayCompletedMissionIds(childId: string, date: string): Promise<string[]> {
  const completions = await prisma.missionCompletion.findMany({
    where: { childId, date },
    select: { missionId: true },
  });
  return completions.map((c) => c.missionId);
}

export async function completeMissionForChild(
  childId: string,
  missionId: string,
  missionName: string,
  amount: number,
  date: string,
) {
  const existing = await prisma.missionCompletion.findUnique({
    where: { childId_missionId_date: { childId, missionId, date } },
  });

  if (existing) {
    return { alreadyDone: true as const, record: null };
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.missionCompletion.create({
      data: { childId, missionId, date },
    });

    const [record, child] = await Promise.all([
      tx.saveRecord.create({
        data: {
          childId,
          amount,
          message: missionName,
          type: "DEPOSIT",
        },
      }),
      tx.child.update({
        where: { id: childId },
        data: {
          totalSaved: { increment: amount },
          points: { increment: 1 },
        },
      }),
    ]);

    return { record, child };
  });

  return {
    alreadyDone: false as const,
    record: {
      id: result.record.id,
      childId: result.record.childId,
      amount: result.record.amount,
      message: result.record.message,
      type: result.record.type,
      createdAt: result.record.createdAt.toISOString(),
    } satisfies SaveRecord,
  };
}
