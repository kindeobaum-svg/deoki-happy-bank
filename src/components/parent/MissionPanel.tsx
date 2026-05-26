"use client";

import { useCallback, useEffect, useState } from "react";
import type { Child } from "@/lib/types";
import {
  completeMission,
  getTodayCompletedMissionIds,
  MISSIONS,
  MISSION_SUCCESS_MESSAGE,
  type Mission,
} from "@/lib/missions";

type MissionPanelProps = {
  child: Child;
  onCompleted?: () => void;
  compact?: boolean;
};

export function MissionPanel({ child, onCompleted, compact = false }: MissionPanelProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [completedFlash, setCompletedFlash] = useState<string | null>(null);
  const [doneToday, setDoneToday] = useState<Set<string>>(() => new Set());

  const syncDone = useCallback(() => {
    setDoneToday(new Set(getTodayCompletedMissionIds(child.id)));
  }, [child.id]);

  useEffect(() => {
    syncDone();
    window.addEventListener("passbook-updated", syncDone);
    window.addEventListener("mission-updated", syncDone);
    window.addEventListener("storage", syncDone);
    return () => {
      window.removeEventListener("passbook-updated", syncDone);
      window.removeEventListener("mission-updated", syncDone);
      window.removeEventListener("storage", syncDone);
    };
  }, [syncDone]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const doneCount = doneToday.size;
  const totalCount = MISSIONS.length;

  function handleMission(mission: Mission) {
    setActiveMissionId(mission.id);

    window.setTimeout(() => {
      const { alreadyDone } = completeMission(child.id, child.name, mission);
      setActiveMissionId(null);

      if (alreadyDone) {
        syncDone();
        showToast("오늘은 이미 완료한 미션이에요 🌱");
        return;
      }

      setDoneToday((prev) => new Set([...prev, mission.id]));
      setCompletedFlash(mission.id);
      showToast(MISSION_SUCCESS_MESSAGE);
      onCompleted?.();
      syncDone();
      window.setTimeout(() => setCompletedFlash(null), 900);
    }, 280);
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
            {MISSIONS.map((mission) => {
              const isDone = doneToday.has(mission.id);
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
