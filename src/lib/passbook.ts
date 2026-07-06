import type { SaveRecord } from "@/lib/types";

export type PassbookEntry = {
  id: string;
  date: string;
  message: string;
  amount: number;
  balance: number;
  type: "deposit" | "withdrawal";
};

export function buildPassbookEntries(records: SaveRecord[]): PassbookEntry[] {
  const sorted = [...records].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let balance = 0;
  return sorted.map((record) => {
    const type = record.type === "WITHDRAWAL" ? "withdrawal" : "deposit";
    balance += type === "deposit" ? record.amount : -record.amount;
    return {
      id: record.id,
      date: record.createdAt,
      message: record.message,
      amount: record.amount,
      balance,
      type,
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
