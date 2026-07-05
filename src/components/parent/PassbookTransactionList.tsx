"use client";

import {
  formatPassbookRowDate,
  formatTransactionAmount,
  sortPassbookEntriesNewestFirst,
  type LocalPassbookEntry,
} from "@/lib/localPassbook";

type PassbookTransactionListProps = {
  entries: LocalPassbookEntry[];
  emptyMessage?: string;
  highlightFirst?: boolean;
  today?: string;
  limit?: number;
};

export function PassbookTransactionList({
  entries,
  emptyMessage = "아직 통장 기록이 없어요.",
  highlightFirst = false,
  today,
  limit,
}: PassbookTransactionListProps) {
  const rows = sortPassbookEntriesNewestFirst(entries).slice(0, limit ?? entries.length);

  if (rows.length === 0) {
    return (
      <div className="passbook-ledger-empty">
        <p className="float-gentle text-4xl">📒</p>
        <p className="mt-3 font-title text-base text-[var(--passbook-navy-deep)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="real-passbook-ledger">
      <div className="real-passbook-ledger-head" aria-hidden>
        <span>날짜</span>
        <span>내용</span>
        <span>금액</span>
        <span>잔액</span>
      </div>
      <ul className="real-passbook-ledger-body">
        {rows.map((entry, i) => {
          const isToday = today && entry.date === today;
          return (
            <li
              key={entry.id}
              className={`real-passbook-row deposit ${isToday ? "today" : ""} ${highlightFirst && i === 0 ? "row-pop" : ""}`}
            >
              <time className="real-passbook-date-col">{formatPassbookRowDate(entry.date)}</time>
              <div className="real-passbook-detail min-w-0">
                <span className="real-passbook-type type-deposit">적립</span>
                <p className="real-passbook-item">{entry.item}</p>
              </div>
              <span className="real-passbook-amount amount-plus">
                {formatTransactionAmount(entry)}
              </span>
              <span className="real-passbook-balance">
                {entry.cumulative.toLocaleString()}원
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
