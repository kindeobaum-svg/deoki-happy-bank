"use client";

import { ParentHero } from "@/components/parent/ParentHero";
import { PASSBOOK_NAME } from "@/lib/branding";
import { EmotionCard } from "@/components/parent/EmotionCard";
import { useApp } from "@/hooks/useAppStore";
import { getChildTotalSaved } from "@/lib/localPassbook";
import {
  ATTENDANCE_COLORS,
  ATTENDANCE_EMOJI,
  ATTENDANCE_LABELS,
  todayStr,
} from "@/lib/attendance";
import { ChildProfileAvatar } from "@/components/ChildProfileAvatar";

export default function ParentChildPage() {
  const { state, selectedChild, selectChild, loading } = useApp();
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
  const hasDiary = state.dailyReports.some(
    (r) => r.childId === child.id && r.date === today,
  );
  const balance = loading
    ? child.totalSaved
    : getChildTotalSaved(child.id, state.passbookTransactions);

  return (
    <div className="parent-page">
      <ParentHero
        greeting="우리 아이"
        childName={child.name}
        childAvatar={child.avatar}
        subtitle={`${child.className} · ${child.name}를 응원해요`}
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

      <section className="forest-profile-card">
        <ChildProfileAvatar avatar={child.avatar} name={child.name} size="xl" className="float-gentle" />
        <p className="mt-4 font-display text-2xl font-bold text-[var(--forest-deep)]">
          {child.name}
        </p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{child.className}</p>

        {todayAttendance && (
          <div
            className={`mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-2 ${ATTENDANCE_COLORS[todayAttendance.status]}`}
          >
            {ATTENDANCE_EMOJI[todayAttendance.status]} 오늘{" "}
            {ATTENDANCE_LABELS[todayAttendance.status]}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--sage-50)] p-4 ring-2 ring-[var(--sage-200)]">
            <p className="text-[10px] font-bold text-[var(--sage-600)]">💰 {PASSBOOK_NAME}</p>
            <p className="mt-1 font-display text-xl font-bold text-[var(--forest-deep)]">
              {balance.toLocaleString()}
              <span className="text-sm">원</span>
            </p>
          </div>
          <div className="rounded-2xl bg-[#fff9e6] p-4 ring-2 ring-[#ffe082]">
            <p className="text-[10px] font-bold text-[#8d6e63]">⭐ 오늘 칭찬</p>
            <p className="mt-1 font-display text-xl font-bold text-[var(--forest-deep)]">
              {todayPraises.length}
              <span className="text-sm">개</span>
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <EmotionCard
          href="/parent/diary"
          emoji="📝"
          title="오늘의 알림장"
          desc={
            hasDiary
              ? "선생님의 따뜻한 한마디가 도착했어요"
              : "알림장을 기다리고 있어요"
          }
          badge={hasDiary ? "NEW" : undefined}
          variant="peach"
        />
        <EmotionCard
          href="/passbook"
          emoji="📒"
          title={PASSBOOK_NAME}
          desc={`지금까지 ${balance.toLocaleString()}원 모았어요`}
        />
        <EmotionCard
          href="/parent/growth"
          emoji="🌳"
          title="성장기록"
          desc="나무가 자라온 과정을 볼 수 있어요"
        />
      </section>
    </div>
  );
}
