"use client";

import type { Child } from "@/lib/types";
import { type LocalPassbookEntry } from "@/lib/localPassbook";
import { HappinessForestPassbook } from "@/components/parent/HappinessForestPassbook";
import { useLocalPassbook } from "@/hooks/useLocalPassbook";

type LocalPassbookViewProps = {
  child: Child;
  entries: LocalPassbookEntry[];
  parentMode?: boolean;
};

export function LocalPassbookView({ child, entries, parentMode = false }: LocalPassbookViewProps) {
  const { refresh } = useLocalPassbook();

  return (
    <HappinessForestPassbook
      child={child}
      entries={entries}
      onAccumulated={refresh}
      parentMode={parentMode}
    />
  );
}
