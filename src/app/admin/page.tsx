"use client";

import { useEffect, useState } from "react";
import { ParentHero } from "@/components/parent/ParentHero";
import { StatBubble } from "@/components/parent/EmotionCard";
import { InviteTeacherPanel } from "@/components/admin/InviteTeacherPanel";
import { RoleQuickNav } from "@/components/RoleQuickNav";
import { ChildProfileAvatar } from "@/components/ChildProfileAvatar";
import { useRequireRole } from "@/hooks/useRequireRole";
import { DAYCARE_NAME, PASSBOOK_NAME } from "@/lib/branding";
import { getTreeStage, TREE_LABELS } from "@/lib/tree";

type AdminStats = {
  totalChildren: number;
  totalSaved: number;
  totalPoints: number;
  todaySaves: number;
  parentCount: number;
  teacherCount: number;
  children: {
    id: string;
    name: string;
    className: string;
    avatar: string;
    accountNumber: string;
    points: number;
    totalSaved: number;
  }[];
  recentSaves: {
    id: string;
    message: string;
    amount: number;
    createdAt: string;
    childName: string;
    childAvatar: string;
  }[];
};

export default function AdminPage() {
  useRequireRole("DIRECTOR");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="parent-page">
        <ParentHero greeting="원장 관리" childName={DAYCARE_NAME} childAvatar="🏫" subtitle="현황 불러오는 중..." />
        <p className="py-8 text-center text-sm text-white/80">관리 현황 불러오는 중...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="parent-page">
        <ParentHero greeting="원장 관리" childName={DAYCARE_NAME} childAvatar="🏫" />
        <p className="py-8 text-center text-sm text-red-600">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="parent-page">
      <ParentHero
        greeting="원장 관리"
        childName={DAYCARE_NAME}
        childAvatar="🏫"
        subtitle="전체 원아 · 반 · 초대 · 적립 한눈에"
      />

      <RoleQuickNav
        className="animate-card-enter animate-card-enter-delay-1"
        items={[
          { href: "/admin#invite", emoji: "✉️", title: "반 초대", desc: "교사 초대코드 만들기" },
          {
            href: "/admin#overview",
            emoji: "📊",
            title: "전체 현황 보기",
            desc: "원아 · 적립 · 활동 통계",
            variant: "peach",
          },
        ]}
      />

      <div id="overview" className="forest-stat-row animate-card-enter animate-card-enter-delay-1 scroll-target">
        <StatBubble label="전체 원아" value={`${stats.totalChildren}명`} emoji="👶" variant="green" />
        <StatBubble
          label="총 적립액"
          value={stats.totalSaved.toLocaleString()}
          emoji="💰"
          variant="gold"
        />
        <StatBubble label="오늘 적립" value={`${stats.todaySaves}건`} emoji="✨" variant="peach" />
      </div>

      <section className="forest-card animate-card-enter animate-card-enter-delay-2">
        <div className="forest-card-body py-3 text-center">
          <p className="text-xs font-bold text-[var(--sage-600)]">학부모 · 교사</p>
          <p className="mt-1 font-display text-xl font-bold text-[var(--sage-800)]">
            {stats.parentCount} · {stats.teacherCount}
          </p>
        </div>
      </section>

      <div id="invite" className="animate-card-enter animate-card-enter-delay-2 scroll-target">
        <InviteTeacherPanel />
      </div>

      <section className="forest-card forest-card-ledger animate-card-enter animate-card-enter-delay-3">
        <div className="forest-card-header">
          <div className="parent-section-title">
            <span className="text-2xl">📒</span>
            원아별 {PASSBOOK_NAME}
          </div>
          <span className="text-xs font-semibold text-[var(--sage-600)]">전체 반 · 전체 원아</span>
        </div>
        <div className="forest-card-body space-y-2 pt-2">
          {stats.children.map((child) => {
            const stage = getTreeStage(child.points);
            return (
              <div key={child.id} className="forest-praise-item">
                <ChildProfileAvatar avatar={child.avatar} name={child.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="forest-praise-text">{child.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                    {child.className} · {child.accountNumber}
                  </p>
                  <p className="text-[10px] font-semibold text-[var(--sage-600)]">{TREE_LABELS[stage]}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-[var(--sage-800)]">
                    {child.totalSaved.toLocaleString()}원
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="forest-card animate-card-enter animate-card-enter-delay-4">
        <div className="forest-card-header">
          <div className="parent-section-title">
            <span className="text-2xl">✨</span>
            최근 적립 활동
          </div>
        </div>
        <div className="forest-card-body space-y-2 pt-2">
          {stats.recentSaves.map((save) => (
            <div key={save.id} className="forest-praise-item">
              <span className="forest-praise-emoji">{save.childAvatar}</span>
              <div className="min-w-0 flex-1">
                <p className="forest-praise-text">{save.childName}</p>
                <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{save.message}</p>
              </div>
              <span className="shrink-0 font-bold text-[var(--sage-600)]">
                +{save.amount.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
