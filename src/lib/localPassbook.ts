import type { PassbookTransaction } from "@/lib/types";

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

export function transactionsToEntries(
  transactions: PassbookTransaction[],
  childName: string,
): LocalPassbookEntry[] {
  return transactions.map((t) => ({
    id: t.id,
    childId: t.childId,
    childName,
    date: t.date,
    item: t.item,
    amount: t.amount,
    cumulative: t.balance,
    type: t.type,
  }));
}

export function getChildPassbookEntries(
  childId: string,
  transactions: PassbookTransaction[],
  childName: string,
): LocalPassbookEntry[] {
  const sorted = [...transactions]
    .filter((t) => t.childId === childId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return transactionsToEntries(sorted, childName);
}

export function getChildTotalSaved(
  childId: string,
  transactions: PassbookTransaction[],
): number {
  const childTx = transactions.filter((t) => t.childId === childId);
  if (childTx.length === 0) return 0;
  const sorted = [...childTx].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return sorted[sorted.length - 1].balance;
}

export type PassbookSummary = {
  totalDeposits: number;
  totalWithdrawals: number;
  balance: number;
};

export function sortPassbookEntriesNewestFirst(entries: LocalPassbookEntry[]): LocalPassbookEntry[] {
  return [...entries].sort((a, b) => {
    const aTime = new Date(a.date + "T12:00:00").getTime();
    const bTime = new Date(b.date + "T12:00:00").getTime();
    if (aTime !== bTime) return bTime - aTime;
    return b.id.localeCompare(a.id);
  });
}

export function getSummaryFromEntries(entries: LocalPassbookEntry[]): PassbookSummary {
  const totalDeposits = entries
    .filter((e) => e.type === "deposit")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawals = entries
    .filter((e) => e.type === "withdrawal")
    .reduce((sum, e) => sum + e.amount, 0);
  const sorted = sortPassbookEntriesNewestFirst(entries);
  const balance = sorted.length ? sorted[0].cumulative : 0;
  return { totalDeposits, totalWithdrawals, balance };
}

export function getChildPassbookSummary(
  childId: string,
  transactions: PassbookTransaction[],
): PassbookSummary {
  const entries = transactions.filter((t) => t.childId === childId);
  const totalDeposits = entries
    .filter((e) => e.type === "deposit")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawals = entries
    .filter((e) => e.type === "withdrawal")
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = getChildTotalSaved(childId, transactions);
  return { totalDeposits, totalWithdrawals, balance };
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

export async function postPassbookTransaction(
  childId: string,
  type: PassbookTransactionType,
  item: string,
  amount: number,
): Promise<{ error?: string }> {
  const res = await fetch(`/api/children/${childId}/passbook-transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, item, amount }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error ?? "처리에 실패했습니다." };
  return {};
}

export async function addDepositEntry(
  childId: string,
  _childName: string,
  item: string,
  amount: number,
) {
  return postPassbookTransaction(childId, "deposit", item, amount);
}

export async function addWithdrawalEntry(
  childId: string,
  _childName: string,
  item: string,
  amount: number,
) {
  return postPassbookTransaction(childId, "withdrawal", item, amount);
}
