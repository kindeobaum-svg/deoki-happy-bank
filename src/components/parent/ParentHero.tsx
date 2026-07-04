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
  const title = isHome && childName ? `${childName}의 숲` : childName ? `${childName}` : "행복부자 숲";
  const lead = greeting ?? (isHome ? "안녕하세요" : "오늘도");

  return (
    <header className={`simple-hero ${className}`}>
      <div className="simple-hero-inner">
        <ChildProfileAvatar avatar={childAvatar} name={childName} size="xl" />
        <div className="min-w-0 flex-1">
          <p className="simple-hero-greeting">{lead}</p>
          <h1 className="simple-hero-title">{title}</h1>
          {subtitle && <p className="simple-hero-sub">{subtitle}</p>}
          <p className="simple-hero-date">{todayLabel()}</p>
        </div>
      </div>
    </header>
  );
}
