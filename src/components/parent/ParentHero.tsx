"use client";

import { ChildProfileAvatar } from "@/components/ChildProfileAvatar";

type ParentHeroProps = {
  greeting?: string;
  childName?: string;
  childAvatar?: string;
  subtitle?: string;
  className?: string;
  isHome?: boolean;
};

function todayLabel() {
  return new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function ParentHero({
  greeting,
  childName,
  childAvatar = "🌻",
  subtitle,
  className = "",
  isHome = false,
}: ParentHeroProps) {
  const isMainHome = isHome && childName;
  const title = isMainHome
    ? "행복한 숲"
    : childName
      ? `${childName}의 숲`
      : "행복부자 숲";
  const lead = greeting ?? (isMainHome ? "오늘도 우리 아이" : "오늘도 우리 아이");

  return (
    <header className={`forest-hero ${className}`}>
      <span className="forest-hero-deco" style={{ top: "1.25rem", left: "1.25rem" }} aria-hidden>
        🍃
      </span>
      <span
        className="forest-hero-deco"
        style={{ top: "2.5rem", right: "1.5rem", animationDelay: "1.2s" }}
        aria-hidden
      >
        🌿
      </span>
      <span
        className="forest-hero-deco"
        style={{ top: "0.75rem", right: "4.5rem", fontSize: "0.875rem", animationDelay: "0.6s" }}
        aria-hidden
      >
        ✨
      </span>
      <span
        className="forest-hero-deco"
        style={{ bottom: "5rem", right: "1rem", fontSize: "1rem", opacity: 0.25 }}
        aria-hidden
      >
        🌲
      </span>
      <div className="forest-hero-hills" aria-hidden />

      <div className="relative flex items-start gap-4">
        <div className="forest-hero-avatar float-gentle">
          <ChildProfileAvatar avatar={childAvatar} name={childName} size="xl" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          {isMainHome && (
            <span className="forest-hero-tagline">🌳 PREMIUM FOREST</span>
          )}
          <p className="forest-hero-greeting">{lead}</p>
          <h1 className="forest-hero-name">
            {isMainHome ? (
              <>
                <span className="block">{childName}의</span>
                <span className="block">{title}</span>
              </>
            ) : (
              title
            )}
          </h1>
          {subtitle && <p className="forest-hero-sub">{subtitle}</p>}
          <p className="forest-hero-date">📅 {todayLabel()}</p>
        </div>
      </div>
    </header>
  );
}
