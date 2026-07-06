"use client";

import type { Child } from "@/lib/types";
import { type LocalPassbookEntry } from "@/lib/localPassbook";
import { HappinessForestPassbook } from "@/components/parent/HappinessForestPassbook";
import { useApp } from "@/hooks/useAppStore";

type LocalPassbookViewProps = {
  child: Child;
  entries: LocalPassbookEntry[];
};

export function LocalPassbookView({ child, entries }: LocalPassbookViewProps) {
  const { refresh } = useApp();

  return (
    <HappinessForestPassbook
      child={child}
      entries={entries}
      onAccumulated={() => void refresh()}
    />
  );
}
