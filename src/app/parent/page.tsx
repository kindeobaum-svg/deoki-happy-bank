"use client";

import { ParentHero } from "@/components/parent/ParentHero";
import { StatBubble } from "@/components/parent/EmotionCard";
import { HappinessTreeCard } from "@/components/parent/HappinessTreeCard";
import { TodayPraiseCard } from "@/components/parent/TodayPraiseCard";
import { RecentPassbookList } from "@/components/parent/RecentPassbookList";
import { SimpleIconGrid } from "@/components/SimpleIconGrid";
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
  const { entries: localEntries, hydrated } = useLocalPassbook();
  const child = selectedChild ?? state.children[0];
  const today = todayStr();

  if (!child) {
    return (
      <div className="parent-page">
        <p className="simple-empty-page">우리 아이 정보를 불러올 수 없어요.</p>
      </div>
    );
  }

  const todayAttendance = state.attendances.find((a) => a.childId === child.id);
  const todayPraises = state.praiseRecords.filter(
    (p) => p.childId === child.id && p.date === today,
  );
  const localTotal = hydrated ? getChildTotalSaved(child.id) : child.totalSaved;
  const hasDiary = state.dailyReports.some(
    (r) => r.childId === child.id && r.date === today,
  );

  return (
    <div className="parent-page">
      <ParentHero
        isHome
        childName={child.name}
        childAvatar={child.avatar}
        subtitle={`${child.className}`}
      />

      {state.children.length > 1 && (
        <section className="simple-card compact">
          <div className="simple-card-body">
            <div className="simple-child-picker">
              {state.children.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChild(c.id)}
                  className={`simple-child-chip tap-scale ${child.id === c.id ? "active" : ""}`}
                >
                  <span>{c.avatar}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <SimpleIconGrid
        items={[
          { href: "/passbook", emoji: "📒", label: PASSBOOK_NAME },
          { href: "/passbook#missions", emoji: "🎯", label: "미션" },
          { href: "/parent/growth", emoji: "🌳", label: "성장" },
          {
            href: "/parent/diary",
            emoji: "📝",
            label: "알림장",
            badge: hasDiary ? "NEW" : undefined,
          },
        ]}
      />

      <div className="simple-stat-row">
        <StatBubble
          emoji={todayAttendance ? ATTENDANCE_EMOJI[todayAttendance.status] : "🌤️"}
          value={todayAttendance ? ATTENDANCE_LABELS[todayAttendance.status] : "대기"}
          label="출석"
          variant="green"
        />
        <StatBubble
          emoji="💰"
          value={hydrated ? `${localTotal.toLocaleString()}` : "—"}
          label="적립"
          variant="gold"
        />
        <StatBubble
          emoji="⭐"
          value={`${todayPraises.length}`}
          label="칭찬"
          variant="peach"
        />
      </div>

      <HappinessTreeCard
        childName={child.name}
        childAvatar={child.avatar}
        totalSaved={localTotal}
      />

      <TodayPraiseCard
        praises={todayPraises}
        childName={child.name}
        childAvatar={child.avatar}
      />

      {hydrated && (
        <RecentPassbookList entries={localEntries} childId={child.id} />
      )}

      {state.announcements.length > 0 && (
        <section className="simple-card">
          <div className="simple-card-header">
            <p className="simple-section-title">
              <span aria-hidden>📢</span>
              소식
            </p>
          </div>
          <div className="simple-card-body space-y-4">
            {state.announcements.slice(0, 2).map((ann) => (
              <div key={ann.id} className="simple-announce">
                <p className="simple-announce-title">{ann.title}</p>
                <p className="simple-announce-body">{ann.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
