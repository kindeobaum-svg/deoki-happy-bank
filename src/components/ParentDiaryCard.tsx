"use client";

import { useCallback, useEffect, useState } from "react";
import type { AttendanceStatus, DailyReport } from "@/lib/types";
import { ATTENDANCE_EMOJI, ATTENDANCE_LABELS } from "@/lib/attendance";
import { DAYCARE_NAME } from "@/lib/branding";
import { ChildProfileAvatar } from "@/components/ChildProfileAvatar";
import {
  completeDiaryDeposit,
  DIARY_SAVE_AMOUNT,
  DIARY_SAVE_SUCCESS,
  isDiaryDepositDone,
} from "@/lib/diaryPassbook";
import { getChildTotalSaved } from "@/lib/localPassbook";

type ParentDiaryCardProps = {
  childId: string;
  childName: string;
  childAvatar: string;
  report: DailyReport;
  attendanceStatus?: AttendanceStatus | null;
};

export function ParentDiaryCard({
  childId,
  childName,
  childAvatar,
  report,
  attendanceStatus,
}: ParentDiaryCardProps) {
  const [deposited, setDeposited] = useState(false);
  const [balance, setBalance] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const syncState = useCallback(() => {
    setDeposited(isDiaryDepositDone(childId, report.date));
    setBalance(getChildTotalSaved(childId));
  }, [childId, report.date]);

  useEffect(() => {
    syncState();
    window.addEventListener("passbook-updated", syncState);
    window.addEventListener("diary-deposit-updated", syncState);
    window.addEventListener("storage", syncState);
    return () => {
      window.removeEventListener("passbook-updated", syncState);
      window.removeEventListener("diary-deposit-updated", syncState);
      window.removeEventListener("storage", syncState);
    };
  }, [syncState]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  function handleTap() {
    if (loading) return;

    setLoading(true);
    window.setTimeout(() => {
      const { alreadyDone } = completeDiaryDeposit(childId, childName, report.date);
      setLoading(false);
      syncState();

      if (alreadyDone) {
        showToast("이미 적립한 알림장이에요 🌱");
        return;
      }

      setJustSaved(true);
      showToast(DIARY_SAVE_SUCCESS);
      window.setTimeout(() => setJustSaved(false), 900);
    }, 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTap}
        disabled={loading}
        className={`diary-card diary-card--tappable tap-scale ${deposited ? "diary-card--deposited" : ""} ${justSaved ? "diary-card--saved" : ""} ${loading ? "diary-card--loading" : ""}`}
        aria-label={`${childName} 알림장, 터치하면 행복숲 통장에 ${DIARY_SAVE_AMOUNT}원 적립`}
      >
        <div className="diary-card-header px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs font-medium text-green-100">{DAYCARE_NAME} 알림장</p>
              <div className="mt-1 flex items-center gap-2">
                <ChildProfileAvatar avatar={childAvatar} name={childName} size="sm" />
                <h2
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: "var(--font-jua)" }}
                >
                  {childName}의 하루
                </h2>
              </div>
            </div>
            <p className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              {formatDiaryDate(report.date)}
            </p>
          </div>
          {attendanceStatus && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-green-800">
              {ATTENDANCE_EMOJI[attendanceStatus]} 오늘 {ATTENDANCE_LABELS[attendanceStatus]}
            </p>
          )}
        </div>

        <div className="diary-card-body space-y-4 px-5 py-5">
          <div className="grid grid-cols-3 gap-2">
            <DiaryChip label="기분" value={report.mood} large />
            <DiaryChip label="식사" value={report.meal} />
            <DiaryChip label="낮잠" value={report.nap} />
          </div>

          <div className="diary-note rounded-2xl px-4 py-4 text-left">
            <p className="text-xs font-semibold text-green-600">선생님 한마디</p>
            <p className="mt-2 text-sm leading-relaxed text-green-900">{report.note}</p>
          </div>
        </div>

        <div className="diary-card-footer px-5 py-3 text-center text-xs">
          {loading ? (
            <span className="diary-card-footer-hint">적립 중...</span>
          ) : deposited ? (
            <span className="diary-card-footer-done">
              ✓ +{DIARY_SAVE_AMOUNT.toLocaleString()}원 적립 완료 · 통장{" "}
              {balance.toLocaleString()}원
            </span>
          ) : (
            <span className="diary-card-footer-hint">
              👆 터치하면 행복숲 통장 +{DIARY_SAVE_AMOUNT.toLocaleString()}원
            </span>
          )}
        </div>
      </button>

      {toast && (
        <div className="forest-praise-toast" role="status" aria-live="polite">
          <span className="forest-praise-toast-emoji">💰</span>
          <p className="forest-praise-toast-text">{toast}</p>
        </div>
      )}
    </>
  );
}

function DiaryChip({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/80 px-2 py-3 text-center ring-1 ring-green-100">
      <p className="text-[10px] font-semibold text-green-600">{label}</p>
      <p className={`mt-1 font-semibold text-green-900 ${large ? "text-2xl" : "text-xs"}`}>
        {value}
      </p>
    </div>
  );
}

function formatDiaryDate(date: string) {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}
