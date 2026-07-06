"use client";

import { useCallback, useState } from "react";
import type { Child } from "@/lib/types";
import { useMissions } from "@/hooks/useMissions";
import { MISSION_SUCCESS_MESSAGE, type Mission } from "@/lib/missions";

type MissionPanelProps = {
  child: Child;
  onCompleted?: () => void;
  compact?: boolean;
};

export function MissionPanel({ child, onCompleted, compact = false }: MissionPanelProps) {
  const { missions, loading, completeMission } = useMissions(child.id);
  const [toast, setToast] = useState<string | null>(null);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [completedFlash, setCompletedFlash] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const doneCount = missions.filter((m) => m.completed).length;
  const totalCount = missions.length;

  async function handleMission(mission: Mission) {
    setActiveMissionId(mission.id);

    const result = await completeMission(mission.id);
    setActiveMissionId(null);

    if ("error" in result && result.error) {
      showToast(result.error);
      return;
    }

    if (result.alreadyDone) {
      showToast("오늘은 이미 완료한 미션이에요 🌱");
      return;
    }

    setCompletedFlash(mission.id);
    showToast(MISSION_SUCCESS_MESSAGE);
    onCompleted?.();
    window.setTimeout(() => setCompletedFlash(null), 900);
  }

  if (loading) {
    return (
      <section className={`forest-card forest-mission-panel ${compact ? "forest-mission-compact" : ""}`}>
        <div className="forest-card-body py-6 text-center text-sm text-[var(--ink-soft)]">
          오늘의 미션을 불러오는 중...
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={`forest-card forest-mission-panel ${compact ? "forest-mission-compact" : ""}`}>
        <div className="forest-card-header">
          <p className="parent-section-title">
            <span className="text-xl">🎯</span>
            오늘의 미션
          </p>
          <span className="forest-mission-badge">
            {doneCount}/{totalCount} · 자동 적립
          </span>
        </div>
        <div className="forest-card-body space-y-3 pt-2">
          <p className="text-sm text-[var(--ink-soft)]">
            미션을 완료하면 {child.name}의 행복숲 통장에 자동으로 적립돼요
          </p>
          <ul className="forest-mission-list space-y-2.5">
            {missions.map((mission) => {
              const isDone = mission.completed;
              const isLoading = activeMissionId === mission.id;
              const justDone = completedFlash === mission.id;

              return (
                <li key={mission.id}>
                  <button
                    type="button"
                    disabled={isLoading || isDone}
                    onClick={() => handleMission(mission)}
                    className={`forest-mission-btn tap-scale w-full ${isDone ? "done" : ""} ${justDone ? "just-done" : ""}`}
                  >
                    <span className="forest-mission-emoji">{mission.emoji}</span>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="forest-mission-name">{mission.name}</p>
                      {!compact && (
                        <p className="forest-mission-desc">{mission.description}</p>
                      )}
                    </div>
                    <div className="forest-mission-reward shrink-0 text-right">
                      {isDone ? (
                        <span className="forest-mission-done-label">완료 ✓</span>
                      ) : isLoading ? (
                        <span className="forest-mission-loading">적립 중...</span>
                      ) : (
                        <>
                          <span className="forest-mission-amount">+{mission.amount.toLocaleString()}원</span>
                          <span className="forest-mission-cta">미션하기</span>
                        </>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {toast && (
        <div className="forest-praise-toast" role="status" aria-live="polite">
          <span className="forest-praise-toast-emoji">⭐</span>
          <p className="forest-praise-toast-text">{toast}</p>
        </div>
      )}
    </>
  );
}
