"use client";

import { useCallback, useMemo } from "react";
import { useApp } from "@/hooks/useAppStore";
import {
  getChildPassbookEntries,
  type LocalPassbookEntry,
} from "@/lib/localPassbook";

export function usePassbook(childId?: string) {
  const { state, selectedChild, refresh } = useApp();

  const entries: LocalPassbookEntry[] = useMemo(() => {
    if (!state.passbookTransactions.length) return [];
    const targets = childId
      ? state.children.filter((c) => c.id === childId)
      : state.children;

    return targets.flatMap((child) =>
      getChildPassbookEntries(child.id, state.passbookTransactions, child.name),
    );
  }, [state.passbookTransactions, state.children, childId]);

  const refreshPassbook = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return {
    entries,
    hydrated: !state.user || state.passbookTransactions !== undefined,
    refresh: refreshPassbook,
    selectedChild,
    transactions: state.passbookTransactions,
    missionCompletions: state.missionCompletions,
    diaryDeposits: state.diaryDeposits,
  };
}

/** @deprecated use usePassbook */
export function useLocalPassbook() {
  return usePassbook();
}
