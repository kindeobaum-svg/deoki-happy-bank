export const DIARY_SAVE_AMOUNT = 500;
export const DIARY_SAVE_ITEM = "알림장 확인";
export const DIARY_SAVE_SUCCESS = "적립 완료";

export function isDiaryDepositDone(
  childId: string,
  reportDate: string,
  deposits: { childId: string; reportDate: string }[],
): boolean {
  return deposits.some((d) => d.childId === childId && d.reportDate === reportDate);
}

export async function completeDiaryDeposit(
  childId: string,
  reportDate: string,
): Promise<{ alreadyDone: boolean; error?: string }> {
  const res = await fetch(`/api/children/${childId}/diary-deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportDate }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { alreadyDone: false, error: data.error ?? "적립에 실패했습니다." };
  return { alreadyDone: data.alreadyDone ?? false };
}

export async function fetchDiaryDepositDone(
  childId: string,
  reportDate: string,
): Promise<boolean> {
  const res = await fetch(
    `/api/children/${childId}/diary-deposit?reportDate=${encodeURIComponent(reportDate)}`,
  );
  if (!res.ok) return false;
  const data = await res.json();
  return data.done ?? false;
}
