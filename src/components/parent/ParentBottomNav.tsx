"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/parent", label: "홈", emoji: "🏠", match: ["/parent"] },
  { href: "/passbook", label: "행복숲", emoji: "📒", match: ["/passbook"] },
  { href: "/parent/growth", label: "성장", emoji: "🌳", match: ["/parent/growth"] },
  { href: "/parent/child", label: "우리아이", emoji: "💚", match: ["/parent/child"] },
  { href: "/parent/diary", label: "알림장", emoji: "📝", match: ["/parent/diary"] },
];

export function ParentBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav fixed inset-x-0 bottom-0 z-50" aria-label="하단 메뉴">
      <div className="bottom-nav-inner bottom-nav-inner-5">
        {tabs.map((tab) => {
          const active = tab.match.some((m) =>
            m === "/parent" ? pathname === "/parent" : pathname.startsWith(m),
          );
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`bottom-nav-item bottom-nav-item-5 tap-scale ${active ? "active" : ""}`}
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
}
