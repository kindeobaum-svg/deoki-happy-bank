"use client";

import { useState } from "react";
import type { Child } from "@/lib/types";
import { EXPENSE_PRESETS } from "@/lib/localPassbook";
import { usePassbook } from "@/hooks/useLocalPassbook";

type ExpensePanelProps = {
  child: Child;
  onCompleted?: () => void;
};

export function ExpensePanel({ child, onCompleted }: ExpensePanelProps) {
  const { balance, withdraw } = usePassbook(child.id, child.name);
  const [selected, setSelected] = useState(EXPENSE_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSpent, setJustSpent] = useState(false);

  async function handleExpense() {
    if (loading) return;
    setLoading(true);
    setError(null);

    const result = await withdraw(selected.name, selected.amount);
    setLoading(false);

    if (result.error) {
      setError(result.error);
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
          onClick={handleExpense}
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
