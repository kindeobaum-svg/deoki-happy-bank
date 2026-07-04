"use client";

import { usePathname } from "next/navigation";
import { useApp } from "@/hooks/useAppStore";
import { HashScroll } from "@/components/HashScroll";
import { ParentBottomNav } from "@/components/parent/ParentBottomNav";
import { StaffBottomNav } from "@/components/StaffBottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const pathname = usePathname();
  const role = state.user?.role;
  const isParent = role === "PARENT";
  const isForestAdmin =
    role === "DIRECTOR" &&
    (pathname.startsWith("/admin") || pathname.startsWith("/passbook"));
  const useForestLayout = isParent || isForestAdmin;
  const hasBottomNav = role === "PARENT" || role === "TEACHER" || role === "DIRECTOR" || role === "CHILD";

  return (
    <div className={hasBottomNav ? "app-bg-parent" : undefined}>
      <HashScroll />
      <main className={useForestLayout ? "parent-main" : "staff-main"}>{children}</main>
      {isParent && <ParentBottomNav />}
      {role && role !== "PARENT" && <StaffBottomNav />}
    </div>
  );
}
