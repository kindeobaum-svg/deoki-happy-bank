import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChildAccess } from "@/lib/childAccess";
import {
  addPassbookTransaction,
  getPassbookTransactions,
} from "@/lib/passbookService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireChildAccess(id);
  if ("error" in access && access.error) return access.error;

  const child = await prisma.child.findUnique({ where: { id } });
  if (!child) {
    return NextResponse.json({ error: "원아를 찾을 수 없습니다." }, { status: 404 });
  }

  const transactions = await getPassbookTransactions(id);
  return NextResponse.json({ child, transactions });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireChildAccess(id);
  if ("error" in access && access.error) return access.error;

  const body = await request.json();
  const type = body.type === "withdrawal" ? "withdrawal" : "deposit";
  const item = String(body.item ?? "").trim();
  const amount = Number(body.amount);

  if (!item) {
    return NextResponse.json({ error: "항목을 입력해 주세요." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "금액이 올바르지 않아요." }, { status: 400 });
  }

  const { transaction, error } = await addPassbookTransaction(id, type, item, amount);
  if (error || !transaction) {
    return NextResponse.json({ error: error ?? "처리에 실패했습니다." }, { status: 400 });
  }

  return NextResponse.json({ transaction });
}
