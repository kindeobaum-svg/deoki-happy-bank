"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ExpensePanel } from "@/components/parent/ExpensePanel";
import { PassbookSummaryCard } from "@/components/parent/PassbookSummaryCard";
import { PassbookTransactionList } from "@/components/parent/PassbookTransactionList";
import { SimpleTabBar } from "@/components/SimpleTabBar";
import { todayStr } from "@/lib/attendance";
import { ChildProfileAvatar } from "@/components/ChildProfileAvatar";

type PassbookTab = "summary" | "missions" | "deposit" | "expense";

const PASSBOOK_TABS = [
  { id: "summary", emoji: "📒", label: "통장" },
  { id: "missions", emoji: "🎯", label: "미션" },
  { id: "deposit", emoji: "🌱", label: "입금" },
  { id: "expense", emoji: "🛒", label: "지출" },
] as const;

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
  const [activeTab, setActiveTab] = useState<PassbookTab>("summary");
  const [selectedItem, setSelectedItem] = useState(SAVE_ITEM_PRESETS[0]);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#missions") {
      setActiveTab("missions");
    }
  }, []);

  const today = todayStr();
  const childEntries = entries.filter((e) => e.childId === child.id);
  const summary = getChildPassbookSummary(child.id);
  const todayDeposits = childEntries.filter((e) => e.date === today && e.type === "deposit");
  const todayDepositAmount = todayDeposits.reduce((sum, e) => sum + e.amount, 0);
  const ledgerEntries = sortPassbookEntriesNewestFirst(childEntries);

  const growthLevel = useMemo(() => {
    if (summary.balance >= 1000) return 3;
    if (summary.balance >= 500) return 2;
    if (summary.balance >= 200) return 1;
    return 0;
  }, [summary.balance]);

  function handleTransactionComplete() {
    setJustSaved(true);
    onAccumulated?.();
    window.setTimeout(() => setJustSaved(false), 900);
  }

  function handleAccumulate() {
    addDepositEntry(child.id, child.name, selectedItem, DEFAULT_SAVE_AMOUNT);
    handleTransactionComplete();
  }

  return (
    <div className="happiness-forest-passbook">
      <SimpleTabBar
        tabs={[...PASSBOOK_TABS]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as PassbookTab)}
        className="mb-5"
      />

      {activeTab === "summary" && (
        <div className="space-y-5">
          <section className={`simple-passbook-card ${justSaved ? "saved" : ""}`}>
            <div className="simple-passbook-cover">
              <span className="simple-passbook-badge">{DAYCARE_NAME}</span>
              <h2 className="simple-passbook-title">{PASSBOOK_NAME}</h2>
              <p className="simple-passbook-tagline">{PASSBOOK_TAGLINE}</p>
              <div className="simple-passbook-account">
                <ChildProfileAvatar avatar={child.avatar} name={child.name} size="lg" />
                <div>
                  <p className="simple-passbook-child">{child.name}</p>
                  <p className="simple-passbook-class">{child.className}</p>
                </div>
              </div>
            </div>

            <div className="simple-passbook-body">
              <PassbookSummaryCard summary={summary} />

              <div className="simple-growth-wrap">
                <div className="simple-growth-bar">
                  <div
                    className="simple-growth-fill"
                    style={{ width: `${Math.min(100, (summary.balance / 1000) * 100)}%` }}
                  />
                </div>
                <p className="simple-growth-hint">
                  {["씨앗", "새싹", "작은 나무", "큰 나무"][growthLevel]} 단계 🌳
                </p>
              </div>

              {todayDeposits.length > 0 ? (
                <div className="simple-today-stamp">
                  <span className="simple-today-icon">✓</span>
                  <div>
                    <p className="simple-today-amount">오늘 +{todayDepositAmount.toLocaleString()}원</p>
                    <p className="simple-today-meta">{todayDeposits.length}건</p>
                  </div>
                </div>
              ) : (
                <p className="simple-empty-hint">오늘의 첫 입금을 기다리고 있어요 🌰</p>
              )}
            </div>
          </section>

          <section className="simple-card">
            <div className="simple-card-header">
              <p className="simple-section-title">
                <span aria-hidden>📖</span>
                통장 기록
              </p>
              <Link href="/parent/growth" className="simple-link">
                성장기록
              </Link>
            </div>
            <div className="simple-card-body">
              <PassbookTransactionList
                entries={ledgerEntries}
                emptyMessage="첫 입금을 기다리고 있어요"
                highlightFirst={justSaved}
                today={today}
              />
            </div>
          </section>
        </div>
      )}

      {activeTab === "missions" && (
        <div id="missions" className="scroll-target">
          <MissionPanel child={child} onCompleted={handleTransactionComplete} />
        </div>
      )}

      {activeTab === "deposit" && (
        <section className="simple-card">
          <div className="simple-card-header">
            <p className="simple-section-title">
              <span aria-hidden>🌱</span>
              행복 입금
            </p>
          </div>
          <div className="simple-card-body space-y-5">
            <p className="simple-hint">입금 항목을 고르고 버튼을 눌러주세요</p>
            <div className="simple-chip-grid">
              {SAVE_ITEM_PRESETS.slice(0, 4).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className={`simple-chip tap-scale ${selectedItem === item ? "active" : ""}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAccumulate}
              className={`simple-primary-action tap-scale ${justSaved ? "done" : ""}`}
            >
              <span className="simple-primary-action-icon">{justSaved ? "✓" : "🌱"}</span>
              <span>{justSaved ? "입금 완료!" : "입금하기"}</span>
              <span className="simple-primary-action-amount">+{DEFAULT_SAVE_AMOUNT.toLocaleString()}원</span>
            </button>
            <p className="simple-center-hint">{selectedItem}</p>
          </div>
        </section>
      )}

      {activeTab === "expense" && (
        <ExpensePanel child={child} onCompleted={handleTransactionComplete} />
      )}
    </div>
  );
}
