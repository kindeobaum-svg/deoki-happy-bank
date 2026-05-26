import type { SaveRecord } from "@/lib/types";

export type PassbookEntry = {
  id: string;
  date: string;
  message: string;
  amount: number;
  balance: number;
};

export function buildPassbookEntries(records: SaveRecord[]): PassbookEntry[] {
  const sorted = [...records].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let balance = 0;
  return sorted.map((record) => {
    balance += record.amount;
    return {
      id: record.id,
      date: record.createdAt,
      message: record.message,
      amount: record.amount,
      balance,
    };
  });
}

export function formatPassbookDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}
