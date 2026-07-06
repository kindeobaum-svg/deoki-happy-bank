"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LocalPassbookView } from "@/components/LocalPassbookView";
import { ParentHero } from "@/components/parent/ParentHero";
import { RoleQuickNav } from "@/components/RoleQuickNav";
import { PASSBOOK_NAME, PASSBOOK_TAGLINE } from "@/lib/branding";
import { useApp } from "@/hooks/useAppStore";
import { useRequireRole } from "@/hooks/useRequireRole";
import { usePassbook } from "@/hooks/useLocalPassbook";
import { getChildPassbookEntries } from "@/lib/localPassbook";

function PassbookContent() {
  useRequireRole("PARENT");
  const { state, selectedChild, selectChild, loading } = useApp();
  const { hydrated } = usePassbook();
  const searchParams = useSearchParams();
  const childIdParam = searchParams.get("child");

  const child = useMemo(() => {
    if (childIdParam) {
      return state.children.find((c) => c.id === childIdParam) ?? selectedChild;
    }
    return selectedChild ?? state.children[0];
  }, [childIdParam, state.children, selectedChild]);

  if (!child) {
    return (
      <p className="py-12 text-center text-white/80">
        {PASSBOOK_NAME} 정보를 불러올 수 없어요.
      </p>
    );
  }

  const childEntries = getChildPassbookEntries(
    child.id,
    state.passbookTransactions,
    child.name,
  );

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

      {!loading && hydrated ? (
        <div className="animate-card-enter animate-card-enter-delay-1">
          <LocalPassbookView child={child} entries={childEntries} />
        </div>
      ) : (
        <div className="forest-empty-state">
          <p className="text-sm text-[var(--ink-soft)]">{PASSBOOK_NAME}을 여는 중...</p>
        </div>
      )}
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
