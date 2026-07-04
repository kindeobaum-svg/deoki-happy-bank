"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ParentHero } from "@/components/parent/ParentHero";
import { StatBubble } from "@/components/parent/EmotionCard";
import { InviteTeacherPanel } from "@/components/admin/InviteTeacherPanel";
import { SimpleTabBar } from "@/components/SimpleTabBar";
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

const ADMIN_TABS = [
  { id: "overview", emoji: "📊", label: "현황" },
  { id: "invite", emoji: "✉️", label: "초대" },
  { id: "children", emoji: "📒", label: "통장" },
] as const;

type AdminTab = (typeof ADMIN_TABS)[number]["id"];

export default function AdminPage() {
  useRequireRole("DIRECTOR");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="parent-page">
        <ParentHero greeting="원장" childName={DAYCARE_NAME} childAvatar="🏫" subtitle="현황 불러오는 중..." />
        <p className="simple-empty-page">관리 현황 불러오는 중...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="parent-page">
        <ParentHero greeting="원장" childName={DAYCARE_NAME} childAvatar="🏫" />
        <p className="simple-empty-page error">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="parent-page">
      <ParentHero
        greeting="원장"
        childName={DAYCARE_NAME}
        childAvatar="🏫"
        subtitle="전체 원아 · 반 · 초대"
      />

      <SimpleTabBar
        tabs={[...ADMIN_TABS]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as AdminTab)}
      />

      {activeTab === "overview" && (
        <div id="overview" className="space-y-5 scroll-target">
          <div className="simple-stat-row">
            <StatBubble label="원아" value={`${stats.totalChildren}명`} emoji="👶" variant="green" />
            <StatBubble
              label="총 적립"
              value={stats.totalSaved.toLocaleString()}
              emoji="💰"
              variant="gold"
            />
            <StatBubble label="오늘" value={`${stats.todaySaves}건`} emoji="✨" variant="peach" />
          </div>

          <section className="simple-card">
            <div className="simple-card-body text-center py-6">
              <p className="simple-hint">학부모 · 교사</p>
              <p className="simple-big-number">
                {stats.parentCount} · {stats.teacherCount}
              </p>
            </div>
          </section>

          <section className="simple-card">
            <div className="simple-card-header">
              <p className="simple-section-title">
                <span aria-hidden>✨</span>
                최근 적립
              </p>
            </div>
            <div className="simple-card-body space-y-3">
              {stats.recentSaves.map((save) => (
                <div key={save.id} className="simple-list-item">
                  <span className="simple-list-emoji">{save.childAvatar}</span>
                  <div className="min-w-0 flex-1">
                    <p className="simple-list-title">{save.childName}</p>
                    <p className="simple-list-desc">{save.message}</p>
                  </div>
                  <span className="simple-list-amount">+{save.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === "invite" && (
        <div id="invite" className="scroll-target">
          <InviteTeacherPanel />
        </div>
      )}

      {activeTab === "children" && (
        <section className="simple-card">
          <div className="simple-card-header">
            <p className="simple-section-title">
              <span aria-hidden>📒</span>
              원아별 {PASSBOOK_NAME}
            </p>
          </div>
          <div className="simple-card-body space-y-3">
            {stats.children.map((child) => {
              const stage = getTreeStage(child.points);
              return (
                <div key={child.id} className="simple-list-item">
                  <ChildProfileAvatar avatar={child.avatar} name={child.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="simple-list-title">{child.name}</p>
                    <p className="simple-list-desc">
                      {child.className} · {TREE_LABELS[stage]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="simple-list-amount">{child.totalSaved.toLocaleString()}원</p>
                    <Link href={`/passbook?child=${child.id}`} className="simple-link">
                      보기
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
