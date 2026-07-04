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
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    children[0]?.id ?? null,
  );
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const today = todayStr();

  const todayPraiseCount = praiseRecords.filter((p) => p.date === today).length;
  const todayDepositCount = useMemo(
    () => entries.filter((e) => e.date === today && e.type === "deposit").length,
    [entries, today],
  );

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? children[0];

  async function handleQuickAction(actionId: string) {
    if (!selectedChild) return;
    const action = TEACHER_HABIT_QUICK_ACTIONS.find((a) => a.id === actionId);
    if (!action || busyKey) return;

    const key = `${selectedChild.id}-${actionId}`;
    setBusyKey(key);

    addDepositEntry(selectedChild.id, selectedChild.name, action.label, action.amount);
    await onAddPraise(selectedChild.id, action.praise, action.emoji);
    refresh();

    setFlashKey(key);
    window.setTimeout(() => setFlashKey(null), 700);
    setBusyKey(null);
  }

  if (children.length === 0) {
    return (
      <section className="simple-card">
        <p className="simple-empty-hint">원아를 등록하면 미션 적립을 시작할 수 있어요.</p>
      </section>
    );
  }

  const balance = selectedChild ? getChildTotalSaved(selectedChild.id) : 0;
  const stage = selectedChild ? getTreeStage(selectedChild.points) : 0;
  const childTodayPraises = selectedChild
    ? praiseRecords.filter((p) => p.childId === selectedChild.id && p.date === today).length
    : 0;

  return (
    <div className="teacher-quick space-y-5">
      <section className="simple-card">
        <div className="simple-card-header">
          <p className="simple-section-title">
            <span aria-hidden>⭐</span>
            미션 적립
          </p>
        </div>
        <div className="simple-card-body">
          <p className="simple-hint">
            {PASSBOOK_NAME} · 탭 한 번 = 칭찬 + 입금
          </p>
          <div className="simple-teacher-stats">
            <span>오늘 칭찬 {todayPraiseCount}건</span>
            <span>입금 {todayDepositCount}건</span>
          </div>
        </div>
      </section>

      <section className="simple-card">
        <div className="simple-card-header">
          <p className="simple-section-title">
            <span aria-hidden>👶</span>
            원아 선택
          </p>
        </div>
        <div className="simple-card-body">
          <div className="simple-child-picker vertical">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                className={`simple-child-select tap-scale ${selectedChildId === child.id ? "active" : ""}`}
              >
                <ChildProfileAvatar avatar={child.avatar} name={child.name} size="md" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="simple-child-select-name">{child.name}</p>
                  <p className="simple-child-select-meta">{child.className}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedChild && (
        <section className="simple-card">
          <div className="simple-card-body space-y-5">
            <div className="simple-teacher-child-summary">
              <ChildProfileAvatar avatar={selectedChild.avatar} name={selectedChild.name} size="lg" />
              <div>
                <p className="simple-teacher-child-name">{selectedChild.name}</p>
                <p className="simple-teacher-child-meta">
                  {TREE_LABELS[stage]}
                  {childTodayPraises > 0 && ` · 오늘 칭찬 ${childTodayPraises}`}
                </p>
                <p className="simple-teacher-balance">{balance.toLocaleString()}원</p>
              </div>
            </div>

            <div className="simple-icon-grid simple-icon-grid-4">
              {TEACHER_HABIT_QUICK_ACTIONS.map((action) => {
                const key = `${selectedChild.id}-${action.id}`;
                const isFlash = flashKey === key;
                const isBusy = busyKey === key;

                return (
                  <button
                    key={action.id}
                    type="button"
                    disabled={!!busyKey}
                    onClick={() => void handleQuickAction(action.id)}
                    className={`simple-icon-item tap-scale ${isFlash ? "active" : ""} ${isBusy ? "busy" : ""}`}
                  >
                    <span className="simple-icon-emoji">{isFlash ? "✓" : action.emoji}</span>
                    <span className="simple-icon-label">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
