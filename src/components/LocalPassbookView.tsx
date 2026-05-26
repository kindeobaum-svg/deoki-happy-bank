"use client";

import type { Child } from "@/lib/types";
import { type LocalPassbookEntry } from "@/lib/localPassbook";
import { HappinessForestPassbook } from "@/components/parent/HappinessForestPassbook";
import { useLocalPassbook } from "@/hooks/useLocalPassbook";

type LocalPassbookViewProps = {
  child: Child;
  entries: LocalPassbookEntry[];
};

export function LocalPassbookView({ child, entries }: LocalPassbookViewProps) {
  const { refresh } = useLocalPassbook();

  return (
    <HappinessForestPassbook
      child={child}
      entries={entries}
      onAccumulated={refresh}
    />
  );
}
