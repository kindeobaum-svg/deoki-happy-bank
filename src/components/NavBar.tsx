"use client";

import Link from "next/link";
import { APP_NAME, DAYCARE_NAME, APP_PROJECT_LABEL } from "@/lib/branding";
import { usePathname } from "next/navigation";
import { useApp } from "@/hooks/useAppStore";
import { LogoutButton } from "@/components/LogoutButton";

export function NavBar() {
  const pathname = usePathname();
  const { state } = useApp();
  const user = state.user;
  const isParent = user?.role === "PARENT";
  const isStaff = user && user.role !== "PARENT";

  if (pathname.startsWith("/login")) return null;

  if (isParent) {
    return (
      <header className="parent-topbar sticky top-0 z-40">
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/parent" className="flex items-center gap-3">
            <span className="parent-logo-badge">🌲</span>
            <span className="font-title text-lg text-white">{APP_NAME}</span>
          </Link>
          <LogoutButton className="parent-logout-btn">나가기</LogoutButton>
        </div>
      </header>
    );
  }

  return (
    <header className="simple-topbar sticky top-0 z-40">
      <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
        <Link href={user ? (user.role === "DIRECTOR" ? "/admin" : user.role === "TEACHER" ? "/teacher" : "/child") : "/"} className="flex items-center gap-3">
          <span className="simple-topbar-icon">🌳</span>
          <div>
            {isStaff && (
              <p className="text-xs font-semibold text-[var(--sage-600)]">{APP_PROJECT_LABEL}</p>
            )}
            <p className="font-title text-base text-[var(--ink)]">{isStaff ? DAYCARE_NAME : APP_NAME}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <LogoutButton className="simple-logout-btn">나가기</LogoutButton>
          ) : (
            <Link href="/login/parent" className="simple-primary-btn">
              시작
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
