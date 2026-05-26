"use client";

import { HappinessTreeCard } from "@/components/parent/HappinessTreeCard";
import { RecentPassbookList } from "@/components/parent/RecentPassbookList";
import { ParentHero } from "@/components/parent/ParentHero";
import { useApp } from "@/hooks/useAppStore";
import { useLocalPassbook } from "@/hooks/useLocalPassbook";
import { getChildTotalSaved } from "@/lib/localPassbook";
import { TREE_LABELS, SAVINGS_STAGE_THRESHOLDS } from "@/lib/tree";

const STAGE_ICONS = ["🌰", "🌱", "🌳", "🌲"];

export default function ParentGrowthPage() {
  const { state, selectedChild, selectChild } = useApp();
  const { entries: localEntries, hydrated } = useLocalPassbook();
  const child = selectedChild ?? state.children[0];

  if (!child) {
    return (
      <div className="parent-page">
        <p className="py-12 text-center text-white/80">성장 기록을 불러올 수 없어요.</p>
      </div>
    );
  }

  const localTotal = hydrated ? getChildTotalSaved(child.id) : child.totalSaved;
  const stage = SAVINGS_STAGE_THRESHOLDS.filter((t) => localTotal >= t).length - 1;

  return (
    <div className="parent-page">
      <ParentHero
        greeting="성장 기록"
        childName={child.name}
        childAvatar={child.avatar}
        subtitle="작은 행복이 큰 나무로 자라요"
      />

      {state.children.length > 1 && (
        <section className="forest-card -mt-2">
          <div className="forest-card-body py-3">
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
        childName={child.name}
        childAvatar={child.avatar}
        totalSaved={localTotal}
      />

      <section className="forest-card">
        <div className="forest-card-header">
          <p className="parent-section-title">
            <span className="text-xl">🗺️</span>
            성장 타임라인
          </p>
        </div>
        <ul className="forest-card-body space-y-2.5 pt-2">
          {TREE_LABELS.map((label, i) => {
            const reached = i <= stage;
            const threshold = SAVINGS_STAGE_THRESHOLDS[i];
            return (
              <li
                key={label}
                className={`forest-timeline-item ${reached ? "done" : "pending"}`}
              >
                <span className="text-2xl">{STAGE_ICONS[i]}</span>
                <div className="flex-1">
                  <p className="font-display text-base font-bold text-[var(--forest-deep)]">
                    {label}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {threshold.toLocaleString()}원 이상 적립
                  </p>
                </div>
                {reached ? (
                  <span className="rounded-full bg-[var(--sage-500)] px-2.5 py-1 text-[10px] font-bold text-white">
                    달성 ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[var(--ink-soft)]">대기</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {hydrated && (
        <RecentPassbookList entries={localEntries} childId={child.id} limit={10} />
      )}
    </div>
  );
}
