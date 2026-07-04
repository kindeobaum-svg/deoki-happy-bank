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

const PAGE_SIZE = 4;

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
  const [page, setPage] = useState(0);

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
  const totalPages = Math.ceil(MISSIONS.length / PAGE_SIZE);
  const visibleMissions = MISSIONS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

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
      <section className={`simple-card simple-mission-panel ${compact ? "compact" : ""}`}>
        <div className="simple-card-header">
          <p className="simple-section-title">
            <span aria-hidden>🎯</span>
            오늘의 미션
          </p>
          <span className="simple-badge">
            {doneCount}/{totalCount}
          </span>
        </div>
        <div className="simple-card-body">
          {!compact && (
            <p className="simple-hint">
              미션을 완료하면 {child.name}의 통장에 자동 적립돼요
            </p>
          )}
          <ul className="simple-mission-list">
            {visibleMissions.map((mission) => {
              const isDone = doneToday.has(mission.id);
              const isLoading = activeMissionId === mission.id;
              const justDone = completedFlash === mission.id;

              return (
                <li key={mission.id}>
                  <button
                    type="button"
                    disabled={isLoading || isDone}
                    onClick={() => handleMission(mission)}
                    className={`simple-mission-btn tap-scale ${isDone ? "done" : ""} ${justDone ? "just-done" : ""}`}
                  >
                    <span className="simple-mission-emoji">{mission.emoji}</span>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="simple-mission-name">{mission.name}</p>
                      {!compact && (
                        <p className="simple-mission-desc">{mission.description}</p>
                      )}
                    </div>
                    <div className="simple-mission-reward">
                      {isDone ? (
                        <span className="simple-mission-done">완료</span>
                      ) : isLoading ? (
                        <span className="simple-mission-loading">...</span>
                      ) : (
                        <span className="simple-mission-amount">+{mission.amount.toLocaleString()}</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="simple-mission-pager">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="simple-pager-btn tap-scale"
                aria-label="이전 미션"
              >
                ←
              </button>
              <span className="simple-pager-label">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="simple-pager-btn tap-scale"
                aria-label="다음 미션"
              >
                →
              </button>
            </div>
          )}
        </div>
      </section>

      {toast && (
        <div className="simple-toast" role="status" aria-live="polite">
          <span aria-hidden>⭐</span>
          <p>{toast}</p>
        </div>
      )}
    </>
  );
}
