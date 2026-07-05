"use client";

import { useMemo, useState } from "react";
import type { Child, PraiseRecord } from "@/lib/types";
import { useLocalPassbook } from "@/hooks/useLocalPassbook";
import { addDepositEntry, getChildTotalSaved } from "@/lib/localPassbook";
import { TEACHER_HABIT_QUICK_ACTIONS } from "@/lib/teacherQuickActions";
import { todayStr } from "@/lib/attendance";
import { PASSBOOK_NAME } from "@/lib/branding";
import { getTreeStage, TREE_LABELS } from "@/lib/tree";
import { ChildProfileAvatar } from "@/components/ChildProfileAvatar";

type TeacherQuickPassbookPanelProps = {
  children: Child[];
  praiseRecords: PraiseRecord[];
  onAddPraise: (childId: string, message: string, emoji: string) => Promise<void>;
};

export function TeacherQuickPassbookPanel({
  children,
  praiseRecords,
  onAddPraise,
}: TeacherQuickPassbookPanelProps) {
  const { entries, refresh } = useLocalPassbook();
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const today = todayStr();

  const todayPraiseCount = praiseRecords.filter((p) => p.date === today).length;

  const todayDepositCount = useMemo(
    () => entries.filter((e) => e.date === today).length,
    [entries, today],
  );

  async function handleQuickAction(child: Child, actionId: string) {
    const action = TEACHER_HABIT_QUICK_ACTIONS.find((a) => a.id === actionId);
    if (!action || busyKey) return;

    const key = `${child.id}-${actionId}`;
    setBusyKey(key);

    addDepositEntry(child.id, child.name, action.label, action.amount);
    await onAddPraise(child.id, action.praise, action.emoji);
    refresh();

    setFlashKey(key);
    window.setTimeout(() => setFlashKey(null), 700);
    setBusyKey(null);
  }

  return (
    <div className="teacher-quick space-y-4">
      <section className="teacher-quick-hero">
        <p className="teacher-quick-hero-badge">30초 모드</p>
        <h2 className="teacher-quick-hero-title">미션 적립</h2>
        <p className="teacher-quick-hero-sub">
          {PASSBOOK_NAME} · 탭 한 번 = 칭찬 + 입금
        </p>
        <div className="teacher-quick-stats">
          <span>오늘 칭찬 {todayPraiseCount}건</span>
          <span className="teacher-quick-stats-dot" aria-hidden />
          <span>성장 입금 {todayDepositCount}건</span>
        </div>
      </section>

      {children.length === 0 ? (
        <p className="teacher-panel-empty mt-3 rounded-2xl bg-white/60 px-4 py-6 text-center">
          원아를 등록하면 미션 적립을 시작할 수 있어요.
        </p>
      ) : (
      <ul className="teacher-quick-list space-y-3">
        {children.map((child) => {
          const balance = getChildTotalSaved(child.id);
          const stage = getTreeStage(child.points);
          const childTodayPraises = praiseRecords.filter(
            (p) => p.childId === child.id && p.date === today,
          ).length;

          return (
            <li key={child.id} className="teacher-quick-card">
              <div className="teacher-quick-card-head">
                <div className="flex items-center gap-3 min-w-0">
                  <ChildProfileAvatar avatar={child.avatar} name={child.name} size="md" />
                  <div className="min-w-0">
                    <p className="teacher-quick-name">{child.name}</p>
                    <p className="teacher-quick-meta">
                      {child.className} · {TREE_LABELS[stage]}
                      {childTodayPraises > 0 && ` · 오늘 칭찬 ${childTodayPraises}`}
                    </p>
                  </div>
                </div>
                <div className="teacher-quick-balance text-right shrink-0">
                  <p className="teacher-quick-balance-label">잔액</p>
                  <p className="teacher-quick-balance-amount">{balance.toLocaleString()}원</p>
                </div>
              </div>

              <div className="teacher-quick-actions">
                {TEACHER_HABIT_QUICK_ACTIONS.map((action) => {
                  const key = `${child.id}-${action.id}`;
                  const isFlash = flashKey === key;
                  const isBusy = busyKey === key;

                  return (
                    <button
                      key={action.id}
                      type="button"
                      disabled={!!busyKey}
                      onClick={() => void handleQuickAction(child, action.id)}
                      className={`teacher-quick-chip tap-scale ${isFlash ? "done" : ""} ${isBusy ? "busy" : ""}`}
                    >
                      <span className="text-base">{isFlash ? "✓" : action.emoji}</span>
                      <span className="teacher-quick-chip-label">{action.label}</span>
                      <span className="teacher-quick-chip-amount">+{action.amount}</span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      )}

      <p className="teacher-quick-footnote">
        생활습관 칭찬이 {PASSBOOK_NAME} 성장 기록과 학부모 알림으로 연결돼요 🌳
      </p>
    </div>
  );
}
