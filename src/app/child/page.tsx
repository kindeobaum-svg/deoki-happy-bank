"use client";

import { useState } from "react";
import { AccumulateButton } from "@/components/AccumulateButton";
import { TreeVisual } from "@/components/TreeVisual";
import { PassbookLink } from "@/components/HappinessPassbook";
import { ParentHero } from "@/components/parent/ParentHero";
import { useApp } from "@/hooks/useAppStore";
import { SAVE_AMOUNT } from "@/lib/tree";

export default function ChildPage() {
  const { state, selectedChild, accumulate, selectChild } = useApp();
  const [justSaved, setJustSaved] = useState(false);
  const [message, setMessage] = useState("오늘도 잘했어요!");
  const isParent = state.user?.role === "PARENT";

  const child = selectedChild ?? state.children[0];

  function handleAccumulate() {
    if (!child) return;
    accumulate(child.id, message);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 800);
  }

  if (!child) {
    return <p className="py-12 text-center text-[var(--ink-soft)]">원아 정보를 불러올 수 없어요.</p>;
  }

  return (
    <div className="space-y-5">
      <ParentHero
        greeting={isParent ? "행복 나무" : "원아 모드"}
        childName={child.name}
        childAvatar={child.avatar}
        subtitle={
          isParent
            ? "우리 아이의 나무가 자라고 있어요"
            : "버튼을 눌러 행복을 모아요"
        }
      />

      {state.children.length > 1 && (
        <section className="card-warm rounded-3xl p-4">
          <p className="text-xs font-semibold text-[var(--sage-600)]">우리 아이</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {state.children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectChild(c.id)}
                className={`quick-pill flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm ${
                  child.id === c.id ? "active" : ""
                }`}
              >
                <span>{c.avatar}</span>
                {c.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card-warm rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-bold text-[var(--sage-800)]">
              {child.avatar} {child.name}
            </p>
            <p className="text-sm text-[var(--ink-soft)]">{child.className}</p>
          </div>
          <div className="rounded-2xl bg-[var(--sage-50)] px-4 py-2 text-center ring-1 ring-[var(--sage-200)]">
            <p className="text-xs text-[var(--sage-600)]">모은 행복</p>
            <p className="text-lg font-bold text-[var(--sage-800)]">
              {child.totalSaved.toLocaleString()}원
            </p>
            <div className="mt-2">
              <PassbookLink childId={child.id} label="통장 보기" />
            </div>
          </div>
        </div>

        <TreeVisual points={child.points} animate={justSaved} theme="light" />

        {!isParent && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <AccumulateButton onAccumulate={handleAccumulate} />
            <p className="text-center text-xs text-[var(--ink-soft)]">
              버튼을 누를 때마다 {SAVE_AMOUNT}원이 적립되고 나무가 자라요!
            </p>
          </div>
        )}

        {isParent && (
          <p className="mt-6 text-center text-sm leading-relaxed text-[var(--ink-soft)]">
            {child.name}의 나무는 행복 포인트 {child.points}개만큼 자랐어요.
            <br />
            원아 모드에서 직접 적립할 수도 있어요.
          </p>
        )}
      </section>

      {!isParent && (
        <section className="card-warm rounded-3xl p-4">
          <p className="font-display text-sm font-bold text-[var(--sage-800)]">오늘의 칭찬 한마디</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["오늘도 잘했어요!", "친구와 나눴어요!", "스스로 했어요!", "웃음이 예뻐요!"].map(
              (msg) => (
                <button
                  key={msg}
                  type="button"
                  onClick={() => setMessage(msg)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    message === msg
                      ? "bg-gradient-to-r from-[var(--sage-400)] to-[var(--sage-600)] text-white"
                      : "bg-[var(--sage-50)] text-[var(--sage-800)] ring-1 ring-[var(--sage-200)]"
                  }`}
                >
                  {msg}
                </button>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}
