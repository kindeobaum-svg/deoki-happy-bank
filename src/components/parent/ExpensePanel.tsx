"use client";

import { useState } from "react";
import type { Child } from "@/lib/types";
import {
  addWithdrawalEntry,
  EXPENSE_PRESETS,
  getChildTotalSaved,
} from "@/lib/localPassbook";

const PAGE_SIZE = 4;

type ExpensePanelProps = {
  child: Child;
  onCompleted?: () => void;
};

export function ExpensePanel({ child, onCompleted }: ExpensePanelProps) {
  const [selected, setSelected] = useState(EXPENSE_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSpent, setJustSpent] = useState(false);
  const [page, setPage] = useState(0);

  const balance = getChildTotalSaved(child.id);
  const totalPages = Math.ceil(EXPENSE_PRESETS.length / PAGE_SIZE);
  const visiblePresets = EXPENSE_PRESETS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function handleExpense() {
    setLoading(true);
    setError(null);

    window.setTimeout(() => {
      const { entry, error: err } = addWithdrawalEntry(
        child.id,
        child.name,
        selected.name,
        selected.amount,
      );
      setLoading(false);

      if (err || !entry) {
        setError(err ?? "지출할 수 없어요");
        return;
      }

      setJustSpent(true);
      onCompleted?.();
      window.setTimeout(() => setJustSpent(false), 900);
    }, 200);
  }

  return (
    <section className="simple-card">
      <div className="simple-card-header">
        <p className="simple-section-title">
          <span aria-hidden>🛒</span>
          사고 싶은 것
        </p>
        <span className="simple-badge">잔액 {balance.toLocaleString()}원</span>
      </div>
      <div className="simple-card-body space-y-5">
        <p className="simple-hint">고른 물건은 지출로 기록돼요</p>
        <div className="simple-expense-grid">
          {visiblePresets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setSelected(preset)}
              className={`simple-expense-item tap-scale ${selected.name === preset.name ? "active" : ""}`}
            >
              <span className="simple-expense-emoji">{preset.emoji}</span>
              <span className="simple-expense-name">{preset.name}</span>
              <span className="simple-expense-amount">-{preset.amount.toLocaleString()}원</span>
            </button>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="simple-mission-pager">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="simple-pager-btn tap-scale"
              aria-label="이전"
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
              aria-label="다음"
            >
              →
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={loading || balance < selected.amount}
          onClick={handleExpense}
          className={`simple-primary-action expense tap-scale ${justSpent ? "done" : ""}`}
        >
          {loading ? "처리 중..." : justSpent ? "지출 완료 ✓" : "지출하기"}
          {!loading && !justSpent && (
            <span className="simple-primary-action-amount">-{selected.amount.toLocaleString()}원</span>
          )}
        </button>
        {balance < selected.amount && (
          <p className="simple-center-hint warn">잔액이 부족해요 🌱</p>
        )}
        {error && <p className="simple-center-hint error">{error}</p>}
      </div>
    </section>
  );
}
