"use client";

import { useApp } from "@/hooks/useAppStore";
import { ParentBottomNav } from "@/components/parent/ParentBottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const isParent = state.user?.role === "PARENT";

  return (
    <div className={isParent ? "app-bg-parent" : undefined}>
      <main className={isParent ? "parent-main" : "staff-main"}>{children}</main>
      {isParent && <ParentBottomNav />}
    </div>
  );
}
