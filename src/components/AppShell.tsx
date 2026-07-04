"use client";

import { usePathname } from "next/navigation";
import { useApp } from "@/hooks/useAppStore";
import { HashScroll } from "@/components/HashScroll";
import { ParentBottomNav } from "@/components/parent/ParentBottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const pathname = usePathname();
  const isParent = state.user?.role === "PARENT";
  const isForestAdmin =
    state.user?.role === "DIRECTOR" &&
    (pathname.startsWith("/admin") || pathname.startsWith("/passbook"));
  const useForestLayout = isParent || isForestAdmin;

  return (
    <div className={useForestLayout ? "app-bg-parent" : undefined}>
      <HashScroll />
      <main className={useForestLayout ? "parent-main" : "staff-main"}>{children}</main>
      {isParent && <ParentBottomNav />}
    </div>
  );
}
