"use client";

import { ParentHero } from "@/components/parent/ParentHero";
import { HappinessTreeCard } from "@/components/parent/HappinessTreeCard";
import { RecentPassbookList } from "@/components/parent/RecentPassbookList";
import { MissionPanel } from "@/components/parent/MissionPanel";
import { RoleQuickNav } from "@/components/RoleQuickNav";
import { useApp } from "@/hooks/useAppStore";
import { useLocalPassbook } from "@/hooks/useLocalPassbook";
import { getChildTotalSaved } from "@/lib/localPassbook";
import { PASSBOOK_NAME } from "@/lib/branding";

export default function ParentPage() {
  const { state, selectedChild, selectChild } = useApp();
  const { entries: localEntries, hydrated, refresh } = useLocalPassbook();
  const child = selectedChild ?? state.children[0];

  if (!child) {
    return (
      <div className="parent-page">
        <p className="py-12 text-center text-white/80">우리 아이 정보를 불러올 수 없어요.</p>
      </div>
    );
  }

  const localTotal = hydrated ? getChildTotalSaved(child.id) : child.totalSaved;

  return (
    <div className="parent-page">
      <ParentHero
        isHome
        childName={child.name}
        childAvatar={child.avatar}
        subtitle={`${child.className} · 좋은 습관, 행복씨앗`}
      />

      <RoleQuickNav
        className="animate-card-enter animate-card-enter-delay-1"
        items={[
          { href: "/passbook#missions", emoji: "🎯", title: "오늘 미션", desc: "미션 확인하고 완료하기" },
          {
            href: "/passbook",
            emoji: "📒",
            title: "우리 아이 통장",
            desc: `${PASSBOOK_NAME} 보기`,
            variant: "peach",
          },
        ]}
      />

      {state.children.length > 1 && (
        <section className="forest-card animate-card-enter animate-card-enter-delay-1">
          <div className="forest-card-body py-3">
            <p className="mb-2 text-xs font-bold text-[var(--sage-600)]">우리 아이 선택</p>
            <div className="forest-child-picker">
              {state.children.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChild(c.id)}
                  className={`forest-child-chip ${child.id === c.id ? "active" : ""}`}
                >
                  <span>{c.avatar}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <HappinessTreeCard
        className="animate-card-enter animate-card-enter-delay-2"
        childName={child.name}
        childAvatar={child.avatar}
        totalSaved={localTotal}
      />

      {hydrated && (
        <div id="missions" className="animate-card-enter animate-card-enter-delay-2 scroll-target">
          <MissionPanel child={child} onCompleted={refresh} />
        </div>
      )}

      {hydrated && (
        <div className="animate-card-enter animate-card-enter-delay-3">
          <RecentPassbookList entries={localEntries} childId={child.id} />
        </div>
      )}
    </div>
  );
}
