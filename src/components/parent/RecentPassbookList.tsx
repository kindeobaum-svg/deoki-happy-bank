"use client";

import Link from "next/link";
import { PASSBOOK_NAME } from "@/lib/branding";
import { sortPassbookEntriesNewestFirst, type LocalPassbookEntry } from "@/lib/localPassbook";
import { PassbookTransactionList } from "@/components/parent/PassbookTransactionList";
import { todayStr } from "@/lib/attendance";

type RecentPassbookListProps = {
  entries: LocalPassbookEntry[];
  childId: string;
  limit?: number;
};

export function RecentPassbookList({
  entries,
  childId,
  limit = 5,
}: RecentPassbookListProps) {
  const childEntries = sortPassbookEntriesNewestFirst(
    entries.filter((e) => e.childId === childId),
  ).slice(0, limit);

  return (
    <section className="forest-card forest-card-ledger">
      <div className="forest-card-header">
        <div className="parent-section-title">
          <span className="text-2xl">📒</span>
          최근 통장 내역
        </div>
        <Link href="/passbook" className="forest-link-btn">
          {PASSBOOK_NAME} →
        </Link>
      </div>

      <div className="forest-card-body pt-2">
        <PassbookTransactionList
          entries={childEntries}
          emptyMessage="첫 씨앗을 기다리고 있어요"
          today={todayStr()}
        />
      </div>
    </section>
  );
}
