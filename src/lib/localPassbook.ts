export type LocalPassbookEntry = {
  id: string;
  childId: string;
  childName: string;
  date: string;
  item: string;
  amount: number;
  cumulative: number;
};

const STORAGE_KEY = "haengbok-local-passbook";

export const SAVE_ITEM_PRESETS = [
  "칭찬 적립",
  "미션 완료",
  "나눔 실천",
  "스스로 하기",
  "출석 보너스",
  "행복 미션",
];

export const DEFAULT_SAVE_AMOUNT = 100;

function normalizeEntry(
  raw: Partial<LocalPassbookEntry> & { id: string; childId: string; type?: string },
): LocalPassbookEntry | null {
  if (raw.type === "withdrawal") return null;

  return {
    id: raw.id,
    childId: raw.childId,
    childName: raw.childName ?? "",
    date: raw.date ?? new Date().toISOString().slice(0, 10),
    item: raw.item ?? "",
    amount: Math.abs(raw.amount ?? 0),
    cumulative: raw.cumulative ?? 0,
  };
}

export function loadLocalPassbook(): LocalPassbookEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<
      Partial<LocalPassbookEntry> & { id: string; childId: string; type?: string }
    >;
    return parsed.map(normalizeEntry).filter((entry): entry is LocalPassbookEntry => entry !== null);
  } catch {
    return [];
  }
}

export function saveLocalPassbook(entries: LocalPassbookEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("passbook-updated"));
}

function getLastBalance(childId: string, existing: LocalPassbookEntry[]): number {
  const childEntries = existing.filter((e) => e.childId === childId);
  if (childEntries.length === 0) return 0;
  return childEntries[childEntries.length - 1].cumulative;
}

export function addPassbookTransaction(
  childId: string,
  childName: string,
  item: string,
  amount: number,
): { entry: LocalPassbookEntry | null; error?: string } {
  const existing = loadLocalPassbook();
  const absAmount = Math.abs(amount);
  const lastBalance = getLastBalance(childId, existing);
  const cumulative = lastBalance + absAmount;

  const entry: LocalPassbookEntry = {
    id: `lp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    childId,
    childName,
    date: new Date().toISOString().slice(0, 10),
    item,
    amount: absAmount,
    cumulative,
  };

  saveLocalPassbook([...existing, entry]);
  return { entry };
}

/** @deprecated use addPassbookTransaction */
export function addLocalPassbookEntry(
  childId: string,
  childName: string,
  item: string,
  amount: number = DEFAULT_SAVE_AMOUNT,
): LocalPassbookEntry {
  const { entry } = addPassbookTransaction(childId, childName, item, amount);
  return entry!;
}

export function addDepositEntry(
  childId: string,
  childName: string,
  item: string,
  amount: number,
) {
  return addPassbookTransaction(childId, childName, item, amount);
}

export function getChildPassbookEntries(childId: string): LocalPassbookEntry[] {
  return loadLocalPassbook().filter((e) => e.childId === childId);
}

export function getChildTotalSaved(childId: string): number {
  const entries = getChildPassbookEntries(childId);
  if (entries.length === 0) return 0;
  return entries[entries.length - 1].cumulative;
}

export type PassbookSummary = {
  totalDeposits: number;
  balance: number;
};

export function getChildPassbookSummary(childId: string): PassbookSummary {
  const entries = getChildPassbookEntries(childId);
  const totalDeposits = entries.reduce((sum, e) => sum + e.amount, 0);
  const balance = entries.length ? entries[entries.length - 1].cumulative : 0;
  return { totalDeposits, balance };
}

export function sortPassbookEntriesNewestFirst(entries: LocalPassbookEntry[]): LocalPassbookEntry[] {
  return [...entries].sort((a, b) => {
    const aTime = Number(a.id.match(/^lp-(\d+)/)?.[1] ?? 0);
    const bTime = Number(b.id.match(/^lp-(\d+)/)?.[1] ?? 0);
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
  return `+${entry.amount.toLocaleString()}`;
}
