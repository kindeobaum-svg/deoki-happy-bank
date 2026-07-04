"use client";

import { ParentHero } from "@/components/parent/ParentHero";
import { StatBubble } from "@/components/parent/EmotionCard";
import { HappinessTreeCard } from "@/components/parent/HappinessTreeCard";
import { TodayPraiseCard } from "@/components/parent/TodayPraiseCard";
import { RecentPassbookList } from "@/components/parent/RecentPassbookList";
import { MissionPanel } from "@/components/parent/MissionPanel";
import { RoleQuickNav } from "@/components/RoleQuickNav";
import { useApp } from "@/hooks/useAppStore";
import { useLocalPassbook } from "@/hooks/useLocalPassbook";
import { getChildTotalSaved } from "@/lib/localPassbook";
import { PASSBOOK_NAME } from "@/lib/branding";
import {
  ATTENDANCE_EMOJI,
  ATTENDANCE_LABELS,
  todayStr,
} from "@/lib/attendance";

export default function ParentPage() {
  const { state, selectedChild, selectChild } = useApp();
  const { entries: localEntries, hydrated, refresh } = useLocalPassbook();
  const child = selectedChild ?? state.children[0];
  const today = todayStr();

  if (!child) {
    return (
      <div className="parent-page">
        <p className="py-12 text-center text-white/80">우리 아이 정보를 불러올 수 없어요.</p>
      </div>
    );
  }

  const todayAttendance = state.attendances.find((a) => a.childId === child.id);
  const todayPraises = state.praiseRecords.filter(
    (p) => p.childId === child.id && p.date === today,
  );
  const localTotal = hydrated ? getChildTotalSaved(child.id) : child.totalSaved;

  return (
    <div className="parent-page">
      <ParentHero
        isHome
        childName={child.name}
        childAvatar={child.avatar}
        subtitle={`${child.className} · 따뜻한 하루를 함께해요`}
      />

      <RoleQuickNav
        className="animate-card-enter animate-card-enter-delay-1"
        items={[
          { href: "/passbook#missions", emoji: "🎯", title: "미션 확인", desc: "오늘의 미션 하기" },
          {
            href: "/passbook",
            emoji: "📒",
            title: "아이 통장 보기",
            desc: `${PASSBOOK_NAME} 열기`,
            variant: "peach",
          },
        ]}
      />

      <div className="forest-stat-row animate-card-enter animate-card-enter-delay-1">
        <StatBubble
          emoji={todayAttendance ? ATTENDANCE_EMOJI[todayAttendance.status] : "🌤️"}
          value={todayAttendance ? ATTENDANCE_LABELS[todayAttendance.status] : "대기"}
          label="오늘 출석"
          variant="green"
        />
        <StatBubble
          emoji="💰"
          value={hydrated ? `${localTotal.toLocaleString()}` : "—"}
          label="행복숲 적립"
          variant="gold"
        />
        <StatBubble
          emoji="⭐"
          value={`${todayPraises.length}`}
          label="오늘 칭찬"
          variant="peach"
        />
      </div>

      {state.children.length > 1 && (
        <section className="forest-card">
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

      <div className="animate-card-enter animate-card-enter-delay-3">
        <TodayPraiseCard
          praises={todayPraises}
          childName={child.name}
          childAvatar={child.avatar}
        />
      </div>

      {hydrated && (
        <div className="animate-card-enter animate-card-enter-delay-3">
          <RecentPassbookList entries={localEntries} childId={child.id} />
        </div>
      )}

      {state.announcements.length > 0 && (
        <section className="forest-card">
          <div className="forest-card-header">
            <p className="parent-section-title">
              <span className="text-xl">📢</span>
              어린이집 소식
            </p>
          </div>
          <div className="forest-card-body space-y-3 pt-2">
            {state.announcements.slice(0, 2).map((ann) => (
              <div key={ann.id} className="forest-announce-item">
                <p className="font-display font-bold text-[var(--forest-deep)]">{ann.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
