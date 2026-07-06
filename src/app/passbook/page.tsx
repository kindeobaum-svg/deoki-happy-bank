"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LocalPassbookView } from "@/components/LocalPassbookView";
import { ParentHero } from "@/components/parent/ParentHero";
import { RoleQuickNav } from "@/components/RoleQuickNav";
import { PASSBOOK_NAME, PASSBOOK_TAGLINE } from "@/lib/branding";
import { useApp } from "@/hooks/useAppStore";
import { recordsToPassbookEntries } from "@/lib/localPassbook";
import { PassbookTransactionList } from "@/components/parent/PassbookTransactionList";
import { PassbookSummaryCard } from "@/components/parent/PassbookSummaryCard";
import { getChildPassbookSummary, sortPassbookEntriesNewestFirst } from "@/lib/localPassbook";
import { todayStr } from "@/lib/attendance";

function PassbookContent() {
  const { state, selectedChild, selectChild, loading } = useApp();
  const searchParams = useSearchParams();
  const childIdParam = searchParams.get("child");
  const isParent = state.user?.role === "PARENT";

  const child = useMemo(() => {
    if (childIdParam) {
      return state.children.find((c) => c.id === childIdParam) ?? selectedChild;
    }
    return selectedChild ?? state.children[0];
  }, [childIdParam, state.children, selectedChild]);

  if (!child) {
    return (
      <p className={`py-12 text-center ${isParent ? "text-white/80" : "text-[var(--ink-soft)]"}`}>
        {PASSBOOK_NAME} 정보를 불러올 수 없어요.
      </p>
    );
  }

  const records = state.saveRecords.filter((r) => r.childId === child.id);

  if (isParent) {
    return (
      <div className="parent-page">
        <ParentHero
          greeting={PASSBOOK_NAME}
          childName={child.name}
          childAvatar={child.avatar}
          subtitle={PASSBOOK_TAGLINE}
        />

        <RoleQuickNav
          className="animate-card-enter"
          items={[
            { href: "/passbook#missions", emoji: "🎯", title: "미션 확인", desc: "오늘의 미션 하기" },
            {
              href: "/passbook",
              emoji: "📒",
              title: "아이 통장 보기",
              desc: `${PASSBOOK_NAME} 보기`,
              variant: "peach",
            },
          ]}
        />

        {state.children.length > 1 && (
          <section className="forest-card -mt-2 animate-card-enter">
            <div className="forest-card-body py-3">
              <p className="mb-2 text-xs font-semibold text-[var(--sage-600)]">{PASSBOOK_NAME} 선택</p>
              <div className="forest-child-picker">
                {state.children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectChild(c.id)}
                    className={`forest-child-chip tap-scale ${child.id === c.id ? "active" : ""}`}
                  >
                    <span>{c.avatar}</span>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {!loading ? (
          <div className="animate-card-enter animate-card-enter-delay-1">
            <LocalPassbookView child={child} />
          </div>
        ) : (
          <div className="forest-empty-state">
            <p className="text-sm text-[var(--ink-soft)]">{PASSBOOK_NAME}을 여는 중...</p>
          </div>
        )}
      </div>
    );
  }

  const entries = recordsToPassbookEntries(child.id, child.name, records);
  const summary = getChildPassbookSummary(child.id, records);
  const ledgerEntries = sortPassbookEntriesNewestFirst(entries);

  return (
    <div className="parent-page">
      <ParentHero
        greeting={PASSBOOK_NAME}
        childName={child.name}
        childAvatar={child.avatar}
        subtitle={`${child.className} · ${PASSBOOK_TAGLINE}`}
      />

      {state.children.length > 1 && (
        <section className="forest-card -mt-2 animate-card-enter">
          <div className="forest-card-body py-3">
            <p className="mb-2 text-xs font-semibold text-[var(--sage-600)]">{PASSBOOK_NAME} 선택</p>
            <div className="forest-child-picker">
              {state.children.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChild(c.id)}
                  className={`forest-child-chip tap-scale ${child.id === c.id ? "active" : ""}`}
                >
                  <span>{c.avatar}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="animate-card-enter animate-card-enter-delay-1 space-y-4">
        <section className="forest-card">
          <div className="forest-card-body">
            <PassbookSummaryCard summary={summary} />
          </div>
        </section>
        <section className="forest-card">
          <div className="forest-card-header">
            <p className="parent-section-title">
              <span className="text-xl">📖</span>
              통장 기록
            </p>
          </div>
          <div className="forest-card-body pt-2">
            <PassbookTransactionList
              entries={ledgerEntries}
              emptyMessage="첫 입금을 기다리고 있어요"
              today={todayStr()}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default function PassbookPage() {
  return (
    <Suspense
      fallback={
        <p className="py-12 text-center text-[var(--ink-soft)]">행복숲 통장 여는 중...</p>
      }
    >
      <PassbookContent />
    </Suspense>
  );
}
