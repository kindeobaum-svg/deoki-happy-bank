import type { PassbookTransactionType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MISSIONS, type Mission } from "@/lib/missions";
import { todayStr } from "@/lib/attendance";

export type PassbookTransactionResult = {
  id: string;
  childId: string;
  type: "deposit" | "withdrawal";
  item: string;
  amount: number;
  balance: number;
  date: string;
  createdAt: string;
};

function toResult(row: {
  id: string;
  childId: string;
  type: PassbookTransactionType;
  item: string;
  amount: number;
  balance: number;
  date: string;
  createdAt: Date;
}): PassbookTransactionResult {
  return {
    id: row.id,
    childId: row.childId,
    type: row.type === "DEPOSIT" ? "deposit" : "withdrawal",
    item: row.item,
    amount: row.amount,
    balance: row.balance,
    date: row.date,
    createdAt: row.createdAt.toISOString(),
  };
}

async function getLastBalance(childId: string): Promise<number> {
  const last = await prisma.passbookTransaction.findFirst({
    where: { childId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { balance: true },
  });
  return last?.balance ?? 0;
}

export async function getPassbookTransactions(
  childId: string,
): Promise<PassbookTransactionResult[]> {
  const rows = await prisma.passbookTransaction.findMany({
    where: { childId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return rows.map(toResult);
}

export async function getChildBalance(childId: string): Promise<number> {
  return getLastBalance(childId);
}

export async function addPassbookTransaction(
  childId: string,
  type: "deposit" | "withdrawal",
  item: string,
  amount: number,
  date?: string,
): Promise<{ transaction: PassbookTransactionResult | null; error?: string }> {
  const absAmount = Math.abs(amount);
  if (absAmount <= 0) {
    return { transaction: null, error: "금액이 올바르지 않아요" };
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    return { transaction: null, error: "원아를 찾을 수 없습니다." };
  }

  const lastBalance = await getLastBalance(childId);
  if (type === "withdrawal" && lastBalance < absAmount) {
    return { transaction: null, error: "잔액이 부족해요" };
  }

  const balance =
    type === "deposit" ? lastBalance + absAmount : lastBalance - absAmount;
  const txDate = date ?? todayStr();
  const prismaType: PassbookTransactionType =
    type === "deposit" ? "DEPOSIT" : "WITHDRAWAL";

  const transaction = await prisma.$transaction(async (tx) => {
    const row = await tx.passbookTransaction.create({
      data: {
        childId,
        type: prismaType,
        item,
        amount: absAmount,
        balance,
        date: txDate,
      },
    });

    const childUpdate: { totalSaved: number; points?: { increment: number } } = {
      totalSaved: balance,
    };
    if (type === "deposit") {
      childUpdate.points = { increment: 1 };
    }

    await tx.child.update({
      where: { id: childId },
      data: childUpdate,
    });

    return row;
  });

  return { transaction: toResult(transaction) };
}

export async function getTodayCompletedMissionIds(childId: string): Promise<string[]> {
  const today = todayStr();
  const rows = await prisma.missionCompletion.findMany({
    where: { childId, date: today },
    select: { missionId: true },
  });
  return rows.map((r) => r.missionId);
}

export async function getTodayMissions(childId: string): Promise<{
  missions: Mission[];
  completedIds: string[];
}> {
  const completedIds = await getTodayCompletedMissionIds(childId);
  return { missions: MISSIONS, completedIds };
}

export async function completeMissionForChild(
  childId: string,
  missionId: string,
): Promise<{
  transaction: PassbookTransactionResult | null;
  alreadyDone: boolean;
  error?: string;
}> {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) {
    return { transaction: null, alreadyDone: false, error: "미션을 찾을 수 없습니다." };
  }

  const today = todayStr();
  const existing = await prisma.missionCompletion.findUnique({
    where: {
      childId_missionId_date: { childId, missionId, date: today },
    },
  });
  if (existing) {
    return { transaction: null, alreadyDone: true };
  }

  const { transaction, error } = await addPassbookTransaction(
    childId,
    "deposit",
    mission.name,
    mission.amount,
  );
  if (error || !transaction) {
    return { transaction: null, alreadyDone: false, error };
  }

  await prisma.missionCompletion.create({
    data: { childId, missionId, date: today },
  });

  return { transaction, alreadyDone: false };
}

export async function isDiaryDepositDone(
  childId: string,
  reportDate: string,
): Promise<boolean> {
  const row = await prisma.diaryDeposit.findUnique({
    where: { childId_reportDate: { childId, reportDate } },
  });
  return !!row;
}

export async function completeDiaryDepositForChild(
  childId: string,
  reportDate: string,
  amount: number,
  item: string,
): Promise<{
  transaction: PassbookTransactionResult | null;
  alreadyDone: boolean;
  error?: string;
}> {
  const existing = await prisma.diaryDeposit.findUnique({
    where: { childId_reportDate: { childId, reportDate } },
  });
  if (existing) {
    return { transaction: null, alreadyDone: true };
  }

  const { transaction, error } = await addPassbookTransaction(
    childId,
    "deposit",
    item,
    amount,
    reportDate,
  );
  if (error || !transaction) {
    return { transaction: null, alreadyDone: false, error };
  }

  await prisma.diaryDeposit.create({
    data: { childId, reportDate },
  });

  return { transaction, alreadyDone: false };
}
