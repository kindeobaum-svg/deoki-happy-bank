"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/hooks/useAppStore";
import type { Role } from "@/lib/types";

type NavTab = {
  href: string;
  label: string;
  emoji: string;
  match: string[];
};

const TABS_BY_ROLE: Record<Role, NavTab[]> = {
  DIRECTOR: [
    { href: "/admin", label: "원장", emoji: "🏫", match: ["/admin"] },
    { href: "/teacher", label: "교사", emoji: "👩‍🏫", match: ["/teacher"] },
    { href: "/passbook", label: "통장", emoji: "📒", match: ["/passbook"] },
    { href: "/child", label: "원아", emoji: "🌱", match: ["/child"] },
  ],
  TEACHER: [
    { href: "/teacher", label: "교사", emoji: "👩‍🏫", match: ["/teacher"] },
    { href: "/passbook", label: "통장", emoji: "📒", match: ["/passbook"] },
    { href: "/child", label: "원아", emoji: "🌱", match: ["/child"] },
    { href: "/", label: "홈", emoji: "🏠", match: ["/"] },
  ],
  CHILD: [
    { href: "/child", label: "나무", emoji: "🌳", match: ["/child"] },
    { href: "/passbook", label: "통장", emoji: "📒", match: ["/passbook"] },
  ],
  PARENT: [],
};

export function StaffBottomNav() {
  const pathname = usePathname();
  const { state } = useApp();
  const [mounted, setMounted] = useState(false);
  const role = state.user?.role;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!role || role === "PARENT") return null;

  const tabs = TABS_BY_ROLE[role];
  if (tabs.length === 0) return null;

  const nav = (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      <div className={`bottom-nav-inner bottom-nav-inner-4`}>
        {tabs.map((tab) => {
          const active = tab.match.some((m) =>
            m === "/" ? pathname === "/" : pathname.startsWith(m),
          );
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`bottom-nav-item bottom-nav-item-4 tap-scale ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="bottom-nav-icon" aria-hidden>
                {tab.emoji}
              </span>
              <span className="bottom-nav-label">{tab.label}</span>
              {active && <span className="bottom-nav-dot" aria-hidden />}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  if (!mounted) return null;
  return createPortal(nav, document.body);
}
