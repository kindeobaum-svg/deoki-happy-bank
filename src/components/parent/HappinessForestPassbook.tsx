"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Child } from "@/lib/types";
import {
  addDepositEntry,
  DEFAULT_SAVE_AMOUNT,
  getChildPassbookSummary,
  SAVE_ITEM_PRESETS,
  sortPassbookEntriesNewestFirst,
  type LocalPassbookEntry,
} from "@/lib/localPassbook";
import { PASSBOOK_NAME, PASSBOOK_TAGLINE, DAYCARE_NAME } from "@/lib/branding";
import { MissionPanel } from "@/components/parent/MissionPanel";
import { PassbookSummaryCard } from "@/components/parent/PassbookSummaryCard";
import { PassbookTransactionList } from "@/components/parent/PassbookTransactionList";
import { todayStr } from "@/lib/attendance";
import { ChildProfileAvatar } from "@/components/ChildProfileAvatar";

type HappinessForestPassbookProps = {
  child: Child;
  entries: LocalPassbookEntry[];
  onAccumulated?: () => void;
};

export function HappinessForestPassbook({
  child,
  entries,
  onAccumulated,
}: HappinessForestPassbookProps) {
  const [selectedItem, setSelectedItem] = useState(SAVE_ITEM_PRESETS[0]);
  const [justSaved, setJustSaved] = useState(false);
  const [sparkle, setSparkle] = useState(false);

  const today = todayStr();
  const childEntries = entries.filter((e) => e.childId === child.id);
  const summary = getChildPassbookSummary(child.id);
  const todayDeposits = childEntries.filter((e) => e.date === today && e.type === "deposit");
  const todayDepositAmount = todayDeposits.reduce((sum, e) => sum + e.amount, 0);
  const ledgerEntries = sortPassbookEntriesNewestFirst(
    childEntries.filter((e) => e.type === "deposit"),
  );

  const growthLevel = useMemo(() => {
    if (summary.balance >= 1000) return 3;
    if (summary.balance >= 500) return 2;
    if (summary.balance >= 200) return 1;
    return 0;
  }, [summary.balance]);

  function handleTransactionComplete() {
    setJustSaved(true);
    setSparkle(true);
    onAccumulated?.();
    window.setTimeout(() => setJustSaved(false), 900);
    window.setTimeout(() => setSparkle(false), 1200);
  }

  function handleAccumulate() {
    addDepositEntry(child.id, child.name, selectedItem, DEFAULT_SAVE_AMOUNT);
    handleTransactionComplete();
  }

  return (
    <div className="happiness-forest-passbook space-y-4">
      <section className={`forest-passbook-card ${justSaved ? "forest-passbook-saved" : ""}`}>
        {sparkle && (
          <>
            <span className="forest-sparkle s1" aria-hidden>✨</span>
            <span className="forest-sparkle s2" aria-hidden>🌿</span>
          </>
        )}

        <div className="forest-passbook-cover">
          <div className="forest-passbook-cover-top">
            <span className="forest-passbook-badge">{DAYCARE_NAME}</span>
            <span className="forest-passbook-seal" aria-hidden>
              OFFICIAL
            </span>
          </div>
          <h2 className="forest-passbook-title">{PASSBOOK_NAME}</h2>
          <p className="forest-passbook-tagline">{PASSBOOK_TAGLINE}</p>
          <div className="forest-passbook-account">
            <ChildProfileAvatar avatar={child.avatar} name={child.name} size="lg" />
            <div>
              <p className="forest-passbook-child">{child.name}</p>
              <p className="forest-passbook-class">{child.className}</p>
            </div>
          </div>
        </div>

        <div className="forest-passbook-body">
          <PassbookSummaryCard summary={summary} />

          <div className="forest-passbook-growth-wrap">
            <div className="forest-passbook-growth-bar">
              <div
                className="forest-passbook-growth-fill"
                style={{ width: `${Math.min(100, (summary.balance / 1000) * 100)}%` }}
              />
            </div>
            <p className="forest-passbook-growth-hint">
              {["씨앗", "새싹", "작은 나무", "큰 나무"][growthLevel]} 단계 · 성장 중 🌳
            </p>
          </div>

          {todayDeposits.length > 0 ? (
            <div className="forest-today-stamp">
              <div className="forest-today-stamp-circle">
                <span className="text-lg">✓</span>
                <span className="forest-today-stamp-text">오늘 입금</span>
              </div>
              <div>
                <p className="font-title text-sm text-[var(--passbook-navy-deep)]">
                  오늘 +{todayDepositAmount.toLocaleString()}원
                </p>
                <p className="text-xs text-[var(--ink-soft)]">
                  {todayDeposits.length}건 · {todayDeposits[todayDeposits.length - 1]?.item}
                </p>
              </div>
            </div>
          ) : (
            <div className="forest-today-stamp forest-today-stamp-empty">
              <span className="text-2xl opacity-60">🌰</span>
              <p className="text-sm text-[var(--ink-soft)]">오늘의 첫 입금을 기다리고 있어요</p>
            </div>
          )}
        </div>
      </section>

      <div id="missions" className="scroll-target">
        <MissionPanel child={child} onCompleted={handleTransactionComplete} compact />
      </div>

      <section className="forest-card">
        <div className="forest-card-body space-y-3">
          <p className="font-title text-sm text-[var(--passbook-navy-deep)]">오늘의 행복 입금</p>
          <div className="flex flex-wrap gap-2">
            {SAVE_ITEM_PRESETS.slice(0, 4).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSelectedItem(item)}
                className={`forest-item-chip tap-scale ${selectedItem === item ? "active" : ""}`}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAccumulate}
            className={`forest-accumulate-btn tap-scale ${justSaved ? "saved" : ""}`}
          >
            <span className="forest-accumulate-icon">{justSaved ? "✓" : "🌱"}</span>
            <span>{justSaved ? "입금 완료!" : "입금하기"}</span>
            <span className="forest-accumulate-amount">+{DEFAULT_SAVE_AMOUNT.toLocaleString()}원</span>
          </button>
          <p className="text-center text-xs text-[var(--ink-soft)]">
            {selectedItem} · 행복숲 통장에 입금돼요
          </p>
        </div>
      </section>

      <section className="forest-card forest-card-ledger passbook-ledger-section">
        <div className="forest-card-header">
          <p className="parent-section-title">
            <span className="text-xl">📖</span>
            통장 기록
          </p>
          <Link href="/parent/growth" className="forest-link-btn">
            성장기록 →
          </Link>
        </div>
        <div className="forest-card-body pt-2">
          <PassbookTransactionList
            entries={ledgerEntries}
            emptyMessage="첫 입금을 기다리고 있어요"
            highlightFirst={justSaved}
            today={today}
          />
        </div>
      </section>
    </div>
  );
}
