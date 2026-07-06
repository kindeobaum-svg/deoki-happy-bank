import type { SaveRecord } from "@/lib/types";
import { buildPassbookEntries } from "@/lib/passbook";

export type PassbookTransactionType = "deposit" | "withdrawal";

export type LocalPassbookEntry = {
  id: string;
  childId: string;
  childName: string;
  date: string;
  item: string;
  amount: number;
  cumulative: number;
  type: PassbookTransactionType;
};

export const SAVE_ITEM_PRESETS = [
  "칭찬 적립",
  "미션 완료",
  "나눔 실천",
  "스스로 하기",
  "출석 보너스",
  "행복 미션",
];

export const EXPENSE_PRESETS = [
  { name: "색연필 구입", amount: 1000, emoji: "✏️" },
  { name: "스티커 구입", amount: 500, emoji: "⭐" },
  { name: "간식 사기", amount: 800, emoji: "🍪" },
  { name: "장난감 구입", amount: 1500, emoji: "🧸" },
  { name: "색칠공부 도구", amount: 1200, emoji: "🎨" },
  { name: "책 사기", amount: 2000, emoji: "📚" },
];

export const DEFAULT_SAVE_AMOUNT = 100;

export function recordsToPassbookEntries(
  childId: string,
  childName: string,
  records: SaveRecord[],
): LocalPassbookEntry[] {
  const entries = buildPassbookEntries(records);
  return entries.map((entry) => ({
    id: entry.id,
    childId,
    childName,
    date: entry.date.slice(0, 10),
    item: entry.message,
    amount: entry.amount,
    cumulative: entry.balance,
    type: entry.type,
  }));
}

export function getChildPassbookEntries(
  childId: string,
  records: SaveRecord[],
): LocalPassbookEntry[] {
  return recordsToPassbookEntries(
    childId,
    "",
    records.filter((r) => r.childId === childId),
  );
}

export function getChildTotalSaved(childId: string, records: SaveRecord[]): number {
  const entries = getChildPassbookEntries(childId, records);
  if (entries.length === 0) return 0;
  return entries[entries.length - 1].cumulative;
}

export type PassbookSummary = {
  totalDeposits: number;
  totalWithdrawals: number;
  balance: number;
};

export function getChildPassbookSummary(childId: string, records: SaveRecord[]): PassbookSummary {
  const entries = getChildPassbookEntries(childId, records);
  const totalDeposits = entries
    .filter((e) => e.type === "deposit")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawals = entries
    .filter((e) => e.type === "withdrawal")
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = entries.length ? entries[entries.length - 1].cumulative : 0;
  return { totalDeposits, totalWithdrawals, balance };
}

export function sortPassbookEntriesNewestFirst(entries: LocalPassbookEntry[]): LocalPassbookEntry[] {
  return [...entries].sort((a, b) => {
    const aTime = new Date(a.date + "T12:00:00").getTime();
    const bTime = new Date(b.date + "T12:00:00").getTime();
    if (aTime !== bTime) return bTime - aTime;
    return b.id.localeCompare(a.id);
  });
}

export function formatPassbookRowDate(date: string) {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatTransactionAmount(entry: LocalPassbookEntry): string {
  const sign = entry.type === "deposit" ? "+" : "-";
  return `${sign}${entry.amount.toLocaleString()}`;
}

export function getTransactionTypeLabel(type: PassbookTransactionType): string {
  return type === "deposit" ? "입금" : "지출";
}
