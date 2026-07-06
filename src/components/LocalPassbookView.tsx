"use client";

import type { Child } from "@/lib/types";
import { HappinessForestPassbook } from "@/components/parent/HappinessForestPassbook";

type LocalPassbookViewProps = {
  child: Child;
};

export function LocalPassbookView({ child }: LocalPassbookViewProps) {
  return <HappinessForestPassbook child={child} />;
}
