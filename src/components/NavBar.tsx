"use client";

import Link from "next/link";
import { APP_NAME, DAYCARE_NAME, APP_PROJECT_LABEL } from "@/lib/branding";
import { usePathname } from "next/navigation";
import { useApp } from "@/hooks/useAppStore";
import { LogoutButton } from "@/components/LogoutButton";
import type { Role } from "@/lib/types";

const staffLinks: { href: string; label: string; emoji: string; roles: Role[] }[] = [
  { href: "/child", label: "원아", emoji: "🌱", roles: ["CHILD", "TEACHER"] },
  { href: "/passbook", label: "통장", emoji: "📒", roles: ["CHILD", "TEACHER"] },
  { href: "/teacher", label: "교사", emoji: "👩‍🏫", roles: ["TEACHER"] },
  { href: "/teacher#classes", label: "반 관리", emoji: "🏫", roles: ["DIRECTOR"] },
  { href: "/admin", label: "원장", emoji: "🏫", roles: ["DIRECTOR"] },
];

export function NavBar() {
  const pathname = usePathname();
  const { state } = useApp();
  const user = state.user;
  const isParent = user?.role === "PARENT";

  if (pathname.startsWith("/login")) return null;

  const visibleLinks = user
    ? staffLinks.filter((l) => l.roles.includes(user.role))
    : [];

  if (isParent) {
    return (
      <header className="parent-topbar sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/parent" className="flex items-center gap-2">
            <span className="parent-logo-badge">🌲</span>
            <span className="font-title text-base text-white">{APP_NAME}</span>
          </Link>
          <LogoutButton className="parent-logout-btn">로그아웃</LogoutButton>
        </div>
      </header>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-green-200/60 bg-white/85 shadow-sm backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--sage-100)] text-xl">
            🌳
          </span>
          <div>
            <p className="font-display text-[11px] font-bold text-[var(--sage-600)]">
              {APP_PROJECT_LABEL}
            </p>
            <p className="text-sm font-semibold text-[var(--ink)]">{DAYCARE_NAME}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <LogoutButton className="btn-soft px-3 py-1.5 text-xs">로그아웃</LogoutButton>
          ) : (
            <Link href="/login/parent" className="btn-primary px-3 py-1.5 text-xs">
              시작하기
            </Link>
          )}
        </div>
      </div>

      {user && visibleLinks.length > 0 && (
        <div
          className="mx-auto grid max-w-lg gap-1 px-3 pb-3"
          style={{ gridTemplateColumns: `repeat(${visibleLinks.length}, minmax(0, 1fr))` }}
        >
          {visibleLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center rounded-2xl px-1.5 py-2 text-[10px] font-semibold transition-all ${
                  active
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-green-50 text-green-700"
                }`}
              >
                <span className="text-base">{link.emoji}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
