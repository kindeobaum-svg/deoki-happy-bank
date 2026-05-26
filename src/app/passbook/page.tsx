"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { HappinessPassbook } from "@/components/HappinessPassbook";
import { LocalPassbookView } from "@/components/LocalPassbookView";
import { ParentHero } from "@/components/parent/ParentHero";
import { PASSBOOK_NAME, PASSBOOK_TAGLINE } from "@/lib/branding";
import { useApp } from "@/hooks/useAppStore";
import { useLocalPassbook } from "@/hooks/useLocalPassbook";

function PassbookContent() {
  const { state, selectedChild, selectChild } = useApp();
  const { entries: localEntries, hydrated } = useLocalPassbook();
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

        {hydrated ? (
          <div className="animate-card-enter animate-card-enter-delay-1">
            <LocalPassbookView child={child} entries={localEntries} />
          </div>
        ) : (
          <div className="forest-empty-state">
            <p className="text-sm text-[var(--ink-soft)]">{PASSBOOK_NAME}을 여는 중...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      <HappinessPassbook child={child} records={records} />
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
