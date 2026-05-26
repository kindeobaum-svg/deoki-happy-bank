export const POINTS_PER_STAGE = 10;
export const SAVE_AMOUNT = 100;
export const MAX_TREE_STAGE = 3;

/** 적립금 기준 4단계: 씨앗 → 새싹 → 작은 나무 → 큰 나무 */
export const SAVINGS_STAGE_THRESHOLDS = [0, 200, 500, 1000];

export const TREE_LABELS = ["씨앗", "새싹", "작은 나무", "큰 나무"] as const;

export function getTreeStage(points: number): number {
  return Math.min(MAX_TREE_STAGE, Math.floor(points / POINTS_PER_STAGE));
}

export function getTreeStageFromSavings(totalSaved: number): number {
  for (let i = SAVINGS_STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalSaved >= SAVINGS_STAGE_THRESHOLDS[i]) return i;
  }
  return 0;
}

export function getTreeProgress(points: number): number {
  const remainder = points % POINTS_PER_STAGE;
  return remainder === 0 && points > 0 ? 100 : (remainder / POINTS_PER_STAGE) * 100;
}

export function getTreeProgressFromSavings(totalSaved: number): number {
  const stage = getTreeStageFromSavings(totalSaved);
  if (stage >= MAX_TREE_STAGE) return 100;
  const current = SAVINGS_STAGE_THRESHOLDS[stage];
  const next = SAVINGS_STAGE_THRESHOLDS[stage + 1];
  return Math.min(100, ((totalSaved - current) / (next - current)) * 100);
}

export function getNextStageSavings(totalSaved: number): number | null {
  const stage = getTreeStageFromSavings(totalSaved);
  if (stage >= MAX_TREE_STAGE) return null;
  return SAVINGS_STAGE_THRESHOLDS[stage + 1] - totalSaved;
}
