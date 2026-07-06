import type { SaveRecord } from "@/lib/types";

export const DIARY_SAVE_AMOUNT = 500;
export const DIARY_SAVE_ITEM = "알림장 확인";
export const DIARY_SAVE_SUCCESS = "적립 완료";

export function isDiaryDepositDone(
  childId: string,
  reportDate: string,
  records: SaveRecord[],
): boolean {
  return records.some(
    (r) =>
      r.childId === childId &&
      r.message === DIARY_SAVE_ITEM &&
      r.createdAt.slice(0, 10) === reportDate,
  );
}
