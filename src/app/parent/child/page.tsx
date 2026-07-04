"use client";

import { ParentHero } from "@/components/parent/ParentHero";
import { PASSBOOK_NAME } from "@/lib/branding";
import { SimpleIconGrid } from "@/components/SimpleIconGrid";
import { useApp } from "@/hooks/useAppStore";
import { useLocalPassbook } from "@/hooks/useLocalPassbook";
import { getChildTotalSaved } from "@/lib/localPassbook";
import {
  ATTENDANCE_COLORS,
  ATTENDANCE_EMOJI,
  ATTENDANCE_LABELS,
  todayStr,
} from "@/lib/attendance";
import { ChildProfileAvatar } from "@/components/ChildProfileAvatar";

export default function ParentChildPage() {
  const { state, selectedChild, selectChild } = useApp();
  const { hydrated } = useLocalPassbook();
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
  const hasDiary = state.dailyReports.some(
    (r) => r.childId === child.id && r.date === today,
  );
  const localTotal = hydrated ? getChildTotalSaved(child.id) : child.totalSaved;

  return (
    <div className="parent-page">
      <ParentHero
        greeting="우리 아이"
        childName={child.name}
        childAvatar={child.avatar}
        subtitle={child.className}
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

      <section className="simple-profile-card">
        <ChildProfileAvatar avatar={child.avatar} name={child.name} size="xl" />
        <p className="simple-profile-name">{child.name}</p>
        <p className="simple-profile-class">{child.className}</p>

        {todayAttendance && (
          <div
            className={`simple-attendance-badge ${ATTENDANCE_COLORS[todayAttendance.status]}`}
          >
            {ATTENDANCE_EMOJI[todayAttendance.status]} {ATTENDANCE_LABELS[todayAttendance.status]}
          </div>
        )}

        <div className="simple-profile-stats">
          <div className="simple-profile-stat">
            <p className="simple-profile-stat-label">💰 {PASSBOOK_NAME}</p>
            <p className="simple-profile-stat-value">{localTotal.toLocaleString()}원</p>
          </div>
          <div className="simple-profile-stat gold">
            <p className="simple-profile-stat-label">⭐ 오늘 칭찬</p>
            <p className="simple-profile-stat-value">{todayPraises.length}개</p>
          </div>
        </div>
      </section>

      <SimpleIconGrid
        items={[
          {
            href: "/parent/diary",
            emoji: "📝",
            label: "알림장",
            badge: hasDiary ? "NEW" : undefined,
          },
          { href: "/passbook", emoji: "📒", label: PASSBOOK_NAME },
          { href: "/parent/growth", emoji: "🌳", label: "성장기록" },
          { href: "/passbook#missions", emoji: "🎯", label: "미션" },
        ]}
      />
    </div>
  );
}
