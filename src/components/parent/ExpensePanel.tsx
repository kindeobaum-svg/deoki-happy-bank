"use client";

import { useState } from "react";
import type { Child } from "@/lib/types";
import { addWithdrawalEntry, getChildTotalSaved } from "@/lib/localPassbook";

type ExpensePanelProps = {
  child: Child;
  onCompleted?: () => void;
};

export function ExpensePanel({ child, onCompleted }: ExpensePanelProps) {
  const [itemName, setItemName] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSpent, setJustSpent] = useState(false);

  const balance = getChildTotalSaved(child.id);
  const amount = Number.parseInt(amountInput.replace(/[^\d]/g, ""), 10) || 0;
  const canSpend = itemName.trim().length > 0 && amount > 0 && balance >= amount;

  function handleExpense() {
    const trimmedItem = itemName.trim();
    if (!trimmedItem) {
      setError("사고 싶은 물건을 입력해 주세요");
      return;
    }
    if (amount <= 0) {
      setError("금액을 입력해 주세요");
      return;
    }
    if (balance < amount) {
      setError("잔액이 부족해요");
      return;
    }

    setLoading(true);
    setError(null);

    window.setTimeout(() => {
      const { entry, error: err } = addWithdrawalEntry(
        child.id,
        child.name,
        trimmedItem,
        amount,
      );
      setLoading(false);

      if (err || !entry) {
        setError(err ?? "지출할 수 없어요");
        return;
      }

      setItemName("");
      setAmountInput("");
      setJustSpent(true);
      onCompleted?.();
      window.setTimeout(() => setJustSpent(false), 900);
    }, 200);
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
          물건과 금액을 직접 입력하면 통장에서 바로 차감돼요
        </p>
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--sage-700)]">
              사고 싶은 물건
            </span>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="예) 색연필, 스티커"
              className="input-warm forest-expense-input w-full px-3 py-2.5 text-sm"
              maxLength={40}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--sage-700)]">
              금액
            </span>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="0"
                className="input-warm forest-expense-input w-full px-3 py-2.5 pr-10 text-sm"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--ink-soft)]">
                원
              </span>
            </div>
          </label>
        </div>
        <button
          type="button"
          disabled={loading || !canSpend}
          onClick={handleExpense}
          className={`forest-expense-btn tap-scale ${justSpent ? "done" : ""}`}
        >
          {loading ? "처리 중..." : justSpent ? "지출 완료 ✓" : "지출하기"}
          {!loading && !justSpent && amount > 0 && (
            <span className="forest-expense-btn-amount">-{amount.toLocaleString()}원</span>
          )}
        </button>
        {amount > 0 && balance < amount && (
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
