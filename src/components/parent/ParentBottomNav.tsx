"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogoutButton } from "@/components/LogoutButton";

const tabs = [
  { href: "/parent", label: "홈", emoji: "🏠", match: ["/parent"] },
  { href: "/passbook", label: "행복숲", emoji: "📒", match: ["/passbook"] },
];

export function ParentBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nav = (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      <div className="bottom-nav-inner bottom-nav-inner-4">
        {tabs.map((tab) => {
          const active = tab.match.some((m) =>
            m === "/parent" ? pathname === "/parent" : pathname.startsWith(m),
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
        <LogoutButton className="bottom-nav-item bottom-nav-item-4 tap-scale">
          <span className="bottom-nav-icon" aria-hidden>
            🚪
          </span>
          <span className="bottom-nav-label">로그아웃</span>
        </LogoutButton>
      </div>
    </nav>
  );

  if (!mounted) return null;
  return createPortal(nav, document.body);
}
