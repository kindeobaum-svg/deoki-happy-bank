"use client";

import Link from "next/link";
import type { Child } from "@/lib/types";
import { buildPassbookEntries, formatPassbookDate } from "@/lib/passbook";
import {
  PassbookAccountHeader,
  PassbookBalance,
  PassbookLedger,
} from "@/components/passbook/PassbookLedger";
import { PassbookInnerPage, PassbookShell } from "@/components/passbook/PassbookShell";

type HappinessPassbookProps = {
  child: Child;
  records: { id: string; childId: string; amount: number; message: string; createdAt: string }[];
};

export function HappinessPassbook({ child, records }: HappinessPassbookProps) {
  const entries = buildPassbookEntries(records);
  const ledgerEntries = [...entries].reverse().map((entry) => ({
    id: entry.id,
    date: formatPassbookDate(entry.date),
    label: entry.message,
    amount: entry.amount,
    cumulative: entry.balance,
  }));

  return (
    <PassbookShell tagline={`행복 포인트 ${child.points}개 · 성장 중`}>
      <PassbookInnerPage>
        <PassbookAccountHeader
          childAvatar={child.avatar}
          childName={child.name}
          accountNumber={child.accountNumber}
        />
        <PassbookBalance
          total={child.totalSaved}
          subtitle={`${child.className} · 행복 성장 통장`}
        />
        <PassbookLedger
          entries={ledgerEntries}
          emptyMessage={
            "아직 적립된 행복이 없어요.\n적립하기를 눌러 첫 씨앗을 심어보세요!"
          }
        />
        <p className="passbook-page-footer mt-6 text-center text-[10px] text-[var(--ink-soft)]">
          작은 습관이 큰 행복의 씨앗이 됩니다 🌳
        </p>
      </PassbookInnerPage>
    </PassbookShell>
  );
}

export function PassbookLink({ childId, label = "통장 보기" }: { childId: string; label?: string }) {
  return (
    <Link
      href={`/passbook?child=${childId}`}
      className="inline-flex items-center gap-1 rounded-xl bg-[var(--peach-soft)] px-4 py-2 text-sm font-semibold text-[var(--sage-800)] ring-1 ring-[var(--sage-200)]"
    >
      📒 {label}
    </Link>
  );
}
