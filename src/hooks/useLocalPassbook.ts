"use client";

import { useCallback } from "react";
import { useApp } from "@/hooks/useAppStore";
import {
  getChildPassbookEntries,
  getChildPassbookSummary,
  getChildTotalSaved,
  recordsToPassbookEntries,
  type LocalPassbookEntry,
  type PassbookSummary,
} from "@/lib/localPassbook";
import type { SaveRecord } from "@/lib/types";

export function usePassbook(childId: string, childName: string) {
  const { state, refresh, addPassbookTransaction } = useApp();

  const records = state.saveRecords.filter((r) => r.childId === childId);
  const entries = recordsToPassbookEntries(childId, childName, records);
  const summary = getChildPassbookSummary(childId, state.saveRecords);
  const balance = getChildTotalSaved(childId, state.saveRecords);

  const deposit = useCallback(
    async (item: string, amount: number) => {
      const result = await addPassbookTransaction(childId, item, amount, "deposit");
      return result;
    },
    [addPassbookTransaction, childId],
  );

  const withdraw = useCallback(
    async (item: string, amount: number) => {
      const result = await addPassbookTransaction(childId, item, amount, "withdrawal");
      return result;
    },
    [addPassbookTransaction, childId],
  );

  return {
    entries,
    records,
    summary,
    balance,
    loading: state.user === null,
    refresh,
    deposit,
    withdraw,
  };
}

export function usePassbookEntries(
  childId: string,
  records: SaveRecord[],
): LocalPassbookEntry[] {
  return getChildPassbookEntries(childId, records);
}

export function usePassbookSummary(childId: string, records: SaveRecord[]): PassbookSummary {
  return getChildPassbookSummary(childId, records);
}

/** @deprecated use usePassbook instead */
export function useLocalPassbook() {
  const { state, refresh } = useApp();
  return {
    entries: state.saveRecords.flatMap((r) => {
      const child = state.children.find((c) => c.id === r.childId);
      return recordsToPassbookEntries(r.childId, child?.name ?? "", [r]);
    }),
    hydrated: state.user !== null,
    refresh,
  };
}
