import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChildAccess } from "@/lib/childAccess";
import { getPassbookTransactions } from "@/lib/passbookService";
import { buildPassbookEntries } from "@/lib/passbook";

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
  const entries = buildPassbookEntries(
    transactions
      .filter((t) => t.type === "deposit")
      .map((t) => ({
        id: t.id,
        childId: t.childId,
        amount: t.amount,
        message: t.item,
        createdAt: t.createdAt,
      })),
  );

  return NextResponse.json({ child, entries, transactions });
}
