"use client";

import Link from "next/link";
import { useApp } from "@/hooks/useAppStore";
import { ParentDiaryCard } from "@/components/ParentDiaryCard";
import { TodayPraiseCard } from "@/components/parent/TodayPraiseCard";
import { ParentHero } from "@/components/parent/ParentHero";
import {
  ATTENDANCE_COLORS,
  ATTENDANCE_EMOJI,
  ATTENDANCE_LABELS,
  todayStr,
} from "@/lib/attendance";

export default function ParentDiaryPage() {
  const { state, selectedChild, selectChild } = useApp();
  const child = selectedChild ?? state.children[0];
  const today = todayStr();

  if (!child) {
    return (
      <div className="parent-page">
        <p className="py-12 text-center text-white/80">알림장을 불러올 수 없어요.</p>
      </div>
    );
  }

  const todayReport = state.dailyReports.find(
    (r) => r.childId === child.id && r.date === today,
  );
  const pastReports = state.dailyReports
    .filter((r) => r.childId === child.id && r.date !== today)
    .slice(0, 5);
  const todayAttendance = state.attendances.find((a) => a.childId === child.id);
  const todayPraises = state.praiseRecords.filter(
    (p) => p.childId === child.id && p.date === today,
  );

  return (
    <div className="parent-page">
      <ParentHero
        greeting="오늘의 알림장"
        childName={child.name}
        childAvatar={child.avatar}
        subtitle="아이의 하루를 따뜻하게 전해 드려요"
      />

      {state.children.length > 1 && (
        <section className="forest-card">
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

      {todayAttendance && (
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-2 ${ATTENDANCE_COLORS[todayAttendance.status]}`}
        >
          {ATTENDANCE_EMOJI[todayAttendance.status]} 오늘{" "}
          {ATTENDANCE_LABELS[todayAttendance.status]}
        </div>
      )}

      {todayPraises.length > 0 && (
        <TodayPraiseCard
          praises={todayPraises}
          childName={child.name}
          childAvatar={child.avatar}
        />
      )}

      {todayReport ? (
        <ParentDiaryCard
          childId={child.id}
          childName={child.name}
          childAvatar={child.avatar}
          report={todayReport}
          attendanceStatus={todayAttendance?.status}
        />
      ) : (
        <section className="forest-card">
          <div className="forest-empty-state">
            <p className="float-gentle text-5xl">📝</p>
            <p className="mt-4 font-display text-lg font-bold text-[var(--forest-deep)]">
              알림장을 준비하고 있어요
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
              선생님이 오늘 하루를 정리 중이에요.
              <br />
              도착하면 알림으로 알려드릴게요.
            </p>
          </div>
        </section>
      )}

      {pastReports.length > 0 && (
        <section className="forest-card">
          <div className="forest-card-header">
            <p className="parent-section-title">
              <span className="text-xl">📚</span>
              지난 알림장
            </p>
          </div>
          <ul className="forest-card-body space-y-3 pt-2">
            {pastReports.map((report) => (
              <li key={report.id} className="forest-announce-item">
                <p className="text-xs font-bold text-[var(--sage-600)]">{report.date}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink)]">{report.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href="/parent" className="forest-link-btn mx-auto block w-fit">
        ← 홈으로
      </Link>
    </div>
  );
}
