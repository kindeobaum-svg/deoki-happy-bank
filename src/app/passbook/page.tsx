"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LocalPassbookView } from "@/components/LocalPassbookView";
import { ParentHero } from "@/components/parent/ParentHero";
import { PASSBOOK_NAME, PASSBOOK_TAGLINE } from "@/lib/branding";
import { useApp } from "@/hooks/useAppStore";
import { useLocalPassbook } from "@/hooks/useLocalPassbook";
import { buildPassbookEntries } from "@/lib/passbook";
import type { LocalPassbookEntry } from "@/lib/localPassbook";

function recordsToForestEntries(
  childId: string,
  childName: string,
  records: { id: string; childId: string; amount: number; message: string; createdAt: string }[],
): LocalPassbookEntry[] {
  const entries = buildPassbookEntries(records);
  return entries.map((entry) => ({
    id: entry.id,
    childId,
    childName,
    date: entry.date,
    item: entry.message,
    amount: entry.amount,
    cumulative: entry.balance,
    type: "deposit" as const,
  }));
}

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
      <p className="simple-empty-page">
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
          <section className="simple-card compact">
            <div className="simple-card-body">
              <div className="simple-child-picker">
                {state.children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectChild(c.id)}
                    className={`simple-child-chip tap-scale ${child.id === c.id ? "active" : ""}`}
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
          <LocalPassbookView child={child} entries={localEntries} />
        ) : (
          <p className="simple-empty-page">{PASSBOOK_NAME}을 여는 중...</p>
        )}
      </div>
    );
  }

  return (
    <div className="parent-page">
      <ParentHero
        greeting={PASSBOOK_NAME}
        childName={child.name}
        childAvatar={child.avatar}
        subtitle={`${child.className} · ${PASSBOOK_TAGLINE}`}
      />

      {state.children.length > 1 && (
        <section className="simple-card compact">
          <div className="simple-card-body">
            <div className="simple-child-picker">
              {state.children.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChild(c.id)}
                  className={`simple-child-chip tap-scale ${child.id === c.id ? "active" : ""}`}
                >
                  <span>{c.avatar}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <LocalPassbookView
        child={child}
        entries={recordsToForestEntries(child.id, child.name, records)}
      />
    </div>
  );
}

export default function PassbookPage() {
  return (
    <Suspense fallback={<p className="simple-empty-page">행복숲 통장 여는 중...</p>}>
      <PassbookContent />
    </Suspense>
  );
}
