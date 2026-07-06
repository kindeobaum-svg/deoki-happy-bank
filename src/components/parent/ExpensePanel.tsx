"use client";

import { useState } from "react";
import type { Child } from "@/lib/types";
import {
  EXPENSE_PRESETS,
  getSummaryFromEntries,
  type LocalPassbookEntry,
} from "@/lib/localPassbook";
import { useApp } from "@/hooks/useAppStore";

type ExpensePanelProps = {
  child: Child;
  entries: LocalPassbookEntry[];
  onCompleted?: () => void;
};

export function ExpensePanel({ child, entries, onCompleted }: ExpensePanelProps) {
  const { addPassbookWithdrawal } = useApp();
  const [selected, setSelected] = useState(EXPENSE_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSpent, setJustSpent] = useState(false);

  const summary = getSummaryFromEntries(entries);
  const balance = summary.balance;

  async function handleExpense() {
    setLoading(true);
    setError(null);

    const { error: err } = await addPassbookWithdrawal(child.id, selected.name, selected.amount);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setJustSpent(true);
    onCompleted?.();
    window.setTimeout(() => setJustSpent(false), 900);
  }

  return (
    <section className="forest-card forest-expense-panel">
      <div className="forest-card-header">
        <p className="parent-section-title">
          <span className="text-xl">🛒</span>
          사고 싶은 것 지출
        </p>
        <span className="forest-expense-balance">
          잔액 {balance.toLocaleString()}원
        </span>
      </div>
      <div className="forest-card-body space-y-3 pt-2">
        <p className="text-sm text-[var(--ink-soft)]">
          고른 물건은 지출로 기록되고 잔액에서 빠져요
        </p>
        <div className="grid grid-cols-2 gap-2">
          {EXPENSE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setSelected(preset)}
              className={`forest-expense-chip tap-scale ${selected.name === preset.name ? "active" : ""}`}
            >
              <span className="text-lg">{preset.emoji}</span>
              <span className="forest-expense-chip-name">{preset.name}</span>
              <span className="forest-expense-chip-amount">-{preset.amount.toLocaleString()}원</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={loading || balance < selected.amount}
          onClick={() => void handleExpense()}
          className={`forest-expense-btn tap-scale ${justSpent ? "done" : ""}`}
        >
          {loading ? "처리 중..." : justSpent ? "지출 완료 ✓" : "지출하기"}
          {!loading && !justSpent && (
            <span className="forest-expense-btn-amount">-{selected.amount.toLocaleString()}원</span>
          )}
        </button>
        {balance < selected.amount && (
          <p className="text-center text-xs font-semibold text-amber-700">
            잔액이 부족해요. 미션을 완료하고 입금해 보세요 🌱
          </p>
        )}
        {error && (
          <p className="text-center text-xs font-semibold text-red-600">{error}</p>
        )}
      </div>
    </section>
  );
}
