import { addDepositEntry, type LocalPassbookEntry } from "@/lib/localPassbook";

export const DIARY_SAVE_AMOUNT = 500;
export const DIARY_SAVE_ITEM = "알림장 확인";
export const DIARY_SAVE_SUCCESS = "적립 완료";

const COMPLETION_KEY = "haengbok-diary-deposits";

type DiaryDeposit = {
  childId: string;
  reportDate: string;
};

function loadDeposits(): DiaryDeposit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPLETION_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DiaryDeposit[];
  } catch {
    return [];
  }
}

function saveDeposits(deposits: DiaryDeposit[]) {
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(deposits));
  window.dispatchEvent(new Event("diary-deposit-updated"));
}

export function isDiaryDepositDone(childId: string, reportDate: string): boolean {
  return loadDeposits().some((d) => d.childId === childId && d.reportDate === reportDate);
}

export function completeDiaryDeposit(
  childId: string,
  childName: string,
  reportDate: string,
): { entry: LocalPassbookEntry | null; alreadyDone: boolean } {
  if (isDiaryDepositDone(childId, reportDate)) {
    return { entry: null, alreadyDone: true };
  }

  const { entry } = addDepositEntry(childId, childName, DIARY_SAVE_ITEM, DIARY_SAVE_AMOUNT);
  if (!entry) {
    return { entry: null, alreadyDone: true };
  }

  saveDeposits([...loadDeposits(), { childId, reportDate }]);
  return { entry, alreadyDone: false };
}
